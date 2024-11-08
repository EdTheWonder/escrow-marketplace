import { createClient } from '@supabase/supabase-js';
import { WalletManager } from './wallet';
import { updateProductStatus } from './products';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class EscrowService {
  
  static async holdPayment(transactionId: string, amount: number) {
    console.log('Starting hold payment process:', { transactionId, amount });
    try {
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('product_id')
        .eq('id', transactionId)
        .single();

      if (txError) {
        console.error('Failed to fetch transaction:', txError);
        throw txError;
      }
      if (!transaction) {
        console.error('Transaction not found:', transactionId);
        throw new Error('Transaction not found');
      }

      console.log('Creating escrow wallet...');
      await this.createEscrowWallet(transactionId, amount);
      console.log('Escrow wallet created successfully');

      console.log('Updating transaction status to in_escrow...');
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'in_escrow' })
        .eq('id', transactionId);

      if (updateError) {
        console.error('Failed to update transaction status:', updateError);
        throw updateError;
      }

      console.log('Updating product status to in_escrow...');
      await updateProductStatus(transaction.product_id, 'in_escrow');
      console.log('Hold payment process completed successfully');

      return transaction;
    } catch (error: any) {
      console.error('Hold payment process failed:', error);
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
    console.log('Starting release to seller process for transaction:', transactionId);
    try {
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*, products!transactions_product_id_fkey (*)')
        .eq('id', transactionId)
        .single();

      if (txError) {
        console.error('Failed to fetch transaction:', txError);
        throw txError;
      }
      if (!transaction) {
        console.error('Transaction not found:', transactionId);
        throw new Error('Transaction not found');
      }

      console.log('Updating transaction status to sold...');
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: 'sold',
          delivery_status: 'delivered',
          completed_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (updateError) {
        console.error('Failed to update transaction:', updateError);
        throw updateError;
      }

      console.log('Updating product status to sold...');
      const { error: productError } = await supabase
        .from('products')
        .update({ status: 'sold' })
        .eq('id', transaction.product_id);

      if (productError) {
        console.error('Failed to update product:', productError);
        throw productError;
      }

      console.log('Updating seller wallet balance...');
      const { error: walletError } = await supabase.rpc('update_wallet_balance', {
        p_user_id: transaction.seller_id,
        p_amount: transaction.amount
      });

      if (walletError) {
        console.error('Failed to update wallet:', walletError);
        throw walletError;
      }

      console.log('Release to seller completed successfully');
      return true;
    } catch (error) {
      console.error('Release to seller process failed:', error);
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
