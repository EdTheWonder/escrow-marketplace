import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class EscrowService {
  static createEscrowWallet(id: any) {
    throw new Error('Method not implemented.');
  }
  static async holdEscrow(transactionId: string, amount: number) {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (!transaction) throw new Error('Transaction not found');

    // Create escrow wallet entry
    const { error: escrowError } = await supabase
      .from('escrow_wallets')
      .insert({
        transaction_id: transactionId,
        amount,
        status: 'held'
      });

    if (escrowError) throw escrowError;

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'in_escrow' })
      .eq('id', transactionId);
  }

  static async releaseToSeller(transactionId: string) {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*, escrow_wallets(*)')
      .eq('id', transactionId)
      .single();

    if (!transaction) throw new Error('Transaction not found');

    // Create wallet transaction
    const { error: walletError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: transaction.seller_id,
        transaction_id: transactionId,
        type: 'escrow_release',
        amount: transaction.amount,
        status: 'completed'
      });

    if (walletError) throw walletError;

    // Update balances and statuses
    await Promise.all([
      supabase.rpc('update_wallet_balance', {
        p_user_id: transaction.seller_id,
        p_amount: transaction.amount
      }),
      supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId),
      supabase
        .from('escrow_wallets')
        .update({ status: 'released' })
        .eq('transaction_id', transactionId),
      supabase
        .from('products')
        .update({ status: 'sold' })
        .eq('id', transaction.product_id)
    ]);
  }

  static async refundToBuyer(transactionId: string) {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (!transaction) throw new Error('Transaction not found');

    // Refund to buyer
    await supabase.rpc('transfer_escrow_to_buyer', {
      p_transaction_id: transactionId,
      p_buyer_id: transaction.buyer_id,
      p_amount: transaction.amount
    });

    // Update statuses
    await Promise.all([
      supabase
        .from('transactions')
        .update({ status: 'refunded' })
        .eq('id', transactionId),
      supabase
        .from('escrow_wallets')
        .update({ status: 'refunded' })
        .eq('transaction_id', transactionId),
      supabase
        .from('products')
        .update({ status: 'available' })
        .eq('id', transaction.product_id)
    ]);
  }
}
