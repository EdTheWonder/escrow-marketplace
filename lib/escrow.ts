import { createClient } from '@supabase/supabase-js';
import { WalletManager } from './wallet';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class EscrowService {
  
  static async holdPayment(transactionId: string, amount: number) {
    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('product_id')
        .eq('id', transactionId)
        .single();

      if (!transaction) throw new Error('Transaction not found');

      // Create escrow wallet first
      await this.createEscrowWallet(transactionId, amount);

      // Use RPC to update both statuses atomically
      const { error } = await supabase
        .rpc('sync_product_transaction_status', {
          p_product_id: transaction.product_id,
          p_transaction_id: transactionId,
          p_status: 'in_escrow'
        });

      if (error) throw error;

      return transaction;
    } catch (error: any) {
      console.error('Hold payment error:', error);
      throw new Error(`Failed to hold payment: ${error.message}`);
    }
  }
  static async createEscrowWallet(transactionId: string, amount: number) {
    try {
      const { error } = await supabase
        .from('escrow_wallets')
        .insert({
          transaction_id: transactionId,
          amount: amount,
          status: 'held'
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Create escrow wallet error:', error);
      throw new Error(`Failed to create escrow wallet: ${error.message}`);
    }
  }

  static async releasePayment(transactionId: string) {
    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*, transactions(*)')
        .eq('id', transactionId)
        .single();

      if (!transaction) throw new Error('Transaction not found');

      // Update seller's wallet balance
      await supabase.rpc('update_wallet_balance', {
        p_user_id: transaction.seller_id,
        p_amount: transaction.amount
      });

      // Update all relevant statuses
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
    } catch (error: any) {
      throw new Error(`Failed to release payment: ${error.message}`);
    }
  }

  static async processRefund(transactionId: string) {
    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (!transaction) throw new Error('Transaction not found');

      // Update buyer's wallet balance
      await supabase.rpc('update_wallet_balance', {
        p_user_id: transaction.buyer_id,
        p_amount: transaction.amount
      });

      // Update all relevant statuses
      await Promise.all([
        supabase
          .from('transactions')
          .update({ status: 'refunded' })
          .eq('id', transactionId),
        supabase
          .from('products')
          .update({ status: 'available' })
          .eq('id', transaction.product_id)
      ]);
    } catch (error: any) {
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  static async releaseToSeller(transactionId: string) {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw new Error('Failed to fetch transaction');
      if (!transaction) throw new Error('Transaction not found');

      // Update all statuses in a transaction
      await Promise.all([
        supabase
          .from('transactions')
          .update({ 
            status: 'pending_feedback',
            completed_at: new Date().toISOString()
          })
          .eq('id', transactionId),
        
        supabase
          .from('products')
          .update({ status: 'sold' })
          .eq('id', transaction.product_id)
      ]);

      // Handle wallet balance update
      await supabase.rpc('update_wallet_balance', {
        p_user_id: transaction.seller_id,
        p_amount: transaction.amount
      });

      return true;
    } catch (error) {
      console.error('Release to seller error:', error);
      throw error;
    }
  }

  static async syncProductAndTransactionStatus(productId: string, transactionId: string, status: string) {
    try {
      console.log('Syncing status:', { productId, transactionId, status });
      
      const { error } = await supabase
        .rpc('sync_product_transaction_status', {
          p_product_id: productId,
          p_transaction_id: transactionId,
          p_status: status
        });
      
      if (error) {
        console.error('Status sync error:', error);
        throw error;
      }
      
      console.log('Status sync completed successfully');
    } catch (error) {
      console.error('Status sync failed:', error);
      throw error;
    }
  }
}
