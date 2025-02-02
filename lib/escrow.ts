import { createClient } from '@supabase/supabase-js';
import { WalletManager } from './wallet';
import { updateProductStatus } from './products';
import { TransactionTimer } from './transaction-timer';

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

      // Start the delivery timer
      await TransactionTimer.startDeliveryTimer(transactionId);

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
    console.log('=== Starting EscrowService.releaseToSeller ===');
    console.log('Transaction ID:', transactionId);
    
    try {
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*, products!transactions_product_id_fkey (*)')
        .eq('id', transactionId)
        .single();

      if (txError || !transaction) {
        throw new Error('Transaction not found');
      }

      // Update both transaction and product status in a single operation using RPC
      const { error } = await supabase
        .rpc('sync_product_transaction_status', {
          p_product_id: transaction.product_id,
          p_transaction_id: transactionId,
          p_status: 'sold'
        });

      if (error) throw error;

      // Update delivery status separately
      const { error: deliveryError } = await supabase
        .from('transactions')
        .update({ delivery_status: 'delivered' })
        .eq('id', transactionId);

      if (deliveryError) throw deliveryError;

      return true;
    } catch (error) {
      console.error('=== EscrowService.releaseToSeller failed ===', error);
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

  static async handleDeliveryConfirmation(transactionId: string) {
    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (!transaction) throw new Error('Transaction not found');

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ 
          delivery_status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      return true;
    } catch (error) {
      console.error('Delivery confirmation failed:', error);
      throw error;
    }
  }

  static async openDispute(transactionId: string, reason: string) {
    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (!transaction) throw new Error('Transaction not found');

      // Create dispute record
      await supabase
        .from('disputes')
        .insert({
          transaction_id: transactionId,
          reason,
          status: 'open',
          created_at: new Date().toISOString()
        });

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status: 'disputed' })
        .eq('id', transactionId);

      return true;
    } catch (error) {
      console.error('Opening dispute failed:', error);
      throw error;
    }
  }
}
