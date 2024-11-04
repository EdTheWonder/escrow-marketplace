import { verifyPayment } from "@/lib/paystack";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { reference, transactionId, productId } = await request.json();
    const verification = await verifyPayment(reference);
    
    if (verification.data.status === 'success') {
      // Set delivery deadline to 12 hours from now
      const deliveryDeadline = new Date(Date.now() + (12 * 60 * 60 * 1000));

      // Update transaction and product status
      const { error: txError } = await supabase
        .from('transactions')
        .update({ 
          status: 'in_escrow',
          delivery_deadline: deliveryDeadline.toISOString()
        })
        .eq('id', transactionId);

      if (txError) throw txError;

      // Update product status
      const { error: productError } = await supabase
        .from('products')
        .update({ status: 'in_escrow' })
        .eq('id', productId);

      if (productError) throw productError;

      return NextResponse.json({ 
        status: 'success',
        transactionId
      });
    }

    return NextResponse.json({ status: 'failed' });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      status: 'failed',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
}
