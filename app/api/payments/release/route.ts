import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { transactionId } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Get transaction details
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*, products(*), sellers:seller_id(wallet_balance)')
      .eq('id', transactionId)
      .single();

    if (error || !transaction) {
      console.error('Transaction not found:', error);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update seller's wallet balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        wallet_balance: transaction.sellers.wallet_balance + transaction.amount 
      })
      .eq('id', transaction.seller_id);

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return NextResponse.json(
        { error: 'Failed to update wallet balance' },
        { status: 500 }
      );
    }

    // Update transaction and product status
    const updates = [
      supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId),
      supabase
        .from('products')
        .update({ status: 'completed' })
        .eq('id', transaction.product_id)
    ];

    const [transactionUpdate, productUpdate] = await Promise.all(updates);

    if (transactionUpdate.error || productUpdate.error) {
      console.error('Error updating transaction or product:', transactionUpdate.error || productUpdate.error);
      return NextResponse.json(
        { error: 'Failed to update transaction or product status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Payment release error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
