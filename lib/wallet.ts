import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class WalletManager {
  static async createWallet(userId: string) {
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select()
      .eq('user_id', userId)
      .single();

    if (existingWallet) {
      return existingWallet;
    }

    const { data: wallet, error } = await supabase
      .from('wallets')
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return wallet;
  }

  static async getWalletBalance(userId: string) {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return wallet?.balance || 0;
  }

  static async holdEscrow(transactionId: string, amount: number) {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('buyer_id, seller_id')
      .eq('id', transactionId)
      .single();

    if (!transaction) throw new Error('Transaction not found');

    // Create escrow hold transaction
    const { error: holdError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: transaction.buyer_id,
        transaction_id: transactionId,
        type: 'escrow_hold',
        amount: amount,
        status: 'completed',
        metadata: {
          seller_id: transaction.seller_id
        }
      });

    if (holdError) throw holdError;

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'escrow_held' })
      .eq('id', transactionId);
  }

  static async releaseEscrow(transactionId: string) {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (!transaction) throw new Error('Transaction not found');

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', transactionId);

    // Update product status through API
    const response = await fetch('/api/products/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: transaction.product_id,
        status: 'sold'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update product status');
    }

    // Update seller's wallet balance
    await supabase.rpc('update_wallet_balance', {
      p_user_id: transaction.seller_id,
      p_amount: transaction.amount
    });
  }

  static async processRefund(transactionId: string) {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (!transaction) throw new Error('Transaction not found');

    // Create refund transaction
    const { error: refundError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: transaction.buyer_id,
        transaction_id: transactionId,
        type: 'refund',
        amount: transaction.amount,
        status: 'completed',
        metadata: {
          seller_id: transaction.seller_id
        }
      });

    if (refundError) throw refundError;

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'refunded' })
      .eq('id', transactionId);

    // Update buyer's wallet balance
    await supabase.rpc('update_wallet_balance', {
      p_user_id: transaction.buyer_id,
      p_amount: transaction.amount
    });
  }
}

