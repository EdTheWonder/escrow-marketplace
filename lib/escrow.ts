import { createClient } from '@supabase/supabase-js';
import { WalletManager } from './wallet';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class EscrowService {
  

  static async createEscrowWallet(transactionId: string, amount: number) {
    try {
      // Create escrow wallet entry
      const { error } = await supabase
        .from('escrow_wallets')
        .insert({
          transaction_id: transactionId,
          amount: amount,
          status: 'holding'
        });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(`Failed to create escrow wallet: ${error.message}`);
    }
  }

  static async holdPayment(transactionId: string, amount: number) {
    try {
      // Create escrow wallet and hold payment
      await this.createEscrowWallet(transactionId, amount);

      // Update transaction status
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'in_escrow' })
        .eq('id', transactionId);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(`Failed to hold payment: ${error.message}`);
    }
  }

  static async releasePayment(transactionId: string) {
    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*, escrow_wallets(*)')
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
          .from('escrow_wallets')
          .update({ status: 'released' })
          .eq('transaction_id', transactionId),
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
          .from('escrow_wallets')
          .update({ status: 'refunded' })
          .eq('transaction_id', transactionId),
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
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*, escrow_wallets(*)')
        .eq('id', transactionId)
        .single();

      if (!transaction) throw new Error('Transaction not found');
      if (!transaction.escrow_wallets) throw new Error('No escrow wallet found');

      // Check delivery deadline
      const deliveryDeadline = new Date(transaction.escrow_wallets.delivery_deadline);
      if (Date.now() > deliveryDeadline.getTime()) {
        await this.processRefund(transactionId);
        throw new Error('Delivery deadline exceeded, payment refunded');
      }

      // Release payment to seller
      await WalletManager.releaseEscrow(transactionId);

      // Update escrow and transaction status
      await Promise.all([
        supabase
          .from('escrow_wallets')
          .update({ status: 'released' })
          .eq('transaction_id', transactionId),
        supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('id', transactionId)
      ]);

      return true;
    } catch (error: any) {
      throw new Error(`Failed to release to seller: ${error.message}`);
    }
  }
}
