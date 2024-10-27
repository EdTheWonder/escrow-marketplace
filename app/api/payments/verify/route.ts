import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';
import { EscrowService } from '@/lib/escrow';

export async function POST(request: Request) {
  try {
    const { reference } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    const verification = await verifyPayment(reference);
    
    if (verification.data.status === 'success') {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('payment_reference', reference)
        .single();

      if (!transaction) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }

      await EscrowService.holdPayment(transaction.id, transaction.amount);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
