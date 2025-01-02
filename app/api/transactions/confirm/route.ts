import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { transactionId } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Get transaction and bank account details
    const { data: transaction } = await supabase
      .from('transactions')
      .select(`
        *,
        products(*),
        seller:seller_id (
          id,
          bank_accounts(*)
        )
      `)
      .eq('id', transactionId)
      .single();

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Initiate bank transfer to seller
    const bankAccount = transaction.seller.bank_accounts[0];
    if (!bankAccount) {
      return NextResponse.json({ error: 'Seller bank account not found' }, { status: 400 });
    }

    // Here you would integrate with your bank transfer API
    // await initiateTransfer(bankAccount, transaction.amount);

    // Update statuses
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
