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
      .select('*, wallet_transactions(*)')
      .eq('id', transactionId)
      .single();

    if (!transaction) throw new Error('Transaction not found');

    // Release funds to seller
    const { error: releaseError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: transaction.seller_id,
        transaction_id: transactionId,
        type: 'escrow_release',
        amount: transaction.amount,
        status: 'completed',
        metadata: {
          buyer_id: transaction.buyer_id
        }
      });

    if (releaseError) throw releaseError;

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', transactionId);

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

