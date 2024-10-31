import { verifyPayment } from "@/lib/paystack";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { reference, transactionId, productId } = await request.json();
    const verification = await verifyPayment(reference);
    
    if (verification.data.status === 'success') {
      await Promise.all([
        supabase
          .from('products')
          .update({ status: 'in_escrow' })
          .eq('id', productId),
        supabase
          .from('transactions')
          .update({ status: 'in_escrow' })
          .eq('id', transactionId)
      ]);

      return NextResponse.json({ 
        status: 'success',
        transactionId
      });
    }

    return NextResponse.json({ status: 'failed' });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ status: 'failed' });
  }
}
