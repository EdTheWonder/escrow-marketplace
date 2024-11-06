import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { reference } = await request.json();
    
    const verification = await verifyPayment(reference);
    
    if (verification.data.status === 'success') {
      // Get transaction by reference or pending status
      const { data: transactions, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError || !transactions?.length) {
        throw new Error('No pending transaction found');
      }

      const transaction = transactions[0];

      // Update transaction and product status atomically
      const { error: updateError } = await supabase.rpc('process_payment_verification', {
        p_transaction_id: transaction.id,
        p_product_id: transaction.product_id,
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
