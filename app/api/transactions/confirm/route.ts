import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { WalletManager } from '@/lib/wallet';

export async function POST(request: Request) {
  try {
    const { transactionId } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Get transaction details
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*, products(*), sellers:seller_id(wallet_balance)')
      .eq('id', transactionId)
      .single();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update seller's wallet balance
    const newBalance = (transaction.sellers.wallet_balance || 0) + transaction.amount;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', transaction.seller_id);

    if (updateError) {
      throw updateError;
    }

    // Update transaction and product status
    await Promise.all([
      supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId),
      supabase
        .from('products')
        .update({ status: 'sold' })
        .eq('id', transaction.product_id)
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transaction confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
