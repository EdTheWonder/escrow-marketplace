import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { reference } = await request.json();
    
    // First verify the payment with Paystack
    const verification = await verifyPayment(reference);
    
    if (verification.data.status === 'success') {
      // Get transaction by reference
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('payment_reference', reference)
        .single();

      if (!transaction) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      // Update transaction and product status atomically
      const { error: updateError } = await supabase.rpc('sync_payment_verification', {
        p_transaction_id: transaction.id,
        p_reference: reference
      });

      if (updateError) throw updateError;

      return NextResponse.json({ status: 'success', transaction });
    }

    return NextResponse.json(
      { error: 'Payment verification failed with Paystack' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
