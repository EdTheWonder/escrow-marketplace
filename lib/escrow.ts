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

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status: 'in_escrow' })
        .eq('id', transactionId);

      // Update product status through API
      const response = await fetch('/api/products/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: transaction.product_id,
          status: 'in_escrow'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update product status');
      }

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
        .select('*')
        .eq('id', transactionId)
        .single();

      if (!transaction) throw new Error('Transaction not found');

      // Update seller's wallet balance
      await supabase.rpc('update_wallet_balance', {
        p_user_id: transaction.seller_id,
        p_amount: transaction.amount
      });

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

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status: 'refunded' })
        .eq('id', transactionId);

      // Update product status through API
      const response = await fetch('/api/products/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: transaction.product_id,
          status: 'available'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update product status');
      }
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

      // Update transaction status
      const { error: txError } = await supabase
        .from('transactions')
        .update({ 
          status: 'pending_feedback',
          completed_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (txError) throw txError;

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
      
      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status })
        .eq('id', transactionId);

      // Update product status through API
      const response = await fetch('/api/products/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update product status');
      }
      
      console.log('Status sync completed successfully');
    } catch (error) {
      console.error('Status sync failed:', error);
      throw error;
    }
  }
}
