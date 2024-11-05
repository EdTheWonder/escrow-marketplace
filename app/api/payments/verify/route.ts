import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';
import { EscrowService } from '@/lib/escrow';

export async function POST(request: Request) {
  try {
    const { reference, transactionId, productId } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    // 1. Verify payment with Paystack
    const verification = await verifyPayment(reference);
    
    if (verification.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // 2. Get transaction details
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // 3. Hold payment in escrow
    await EscrowService.holdPayment(transaction.id, transaction.amount);

    // 4. Update transaction and product status
    await Promise.all([
      supabase
        .from('transactions')
        .update({ 
          status: 'in_escrow',
          payment_reference: reference
        })
        .eq('id', transactionId),
      
      supabase
        .from('products')
        .update({ status: 'in_escrow' })
        .eq('id', productId)
    ]);

    return NextResponse.json({ status: 'success', transactionId });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
