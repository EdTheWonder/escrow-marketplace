// lib/dispute.ts

import { supabase } from './supabase';
import { toast } from 'sonner';

export class DisputeService {
  static async createDispute(transactionId: string, reason: string) {
    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*, delivery_deadline, delivery_status')
        .eq('id', transactionId)
        .single();

      if (!transaction) throw new Error('Transaction not found');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check dispute conditions
      const isSeller = user.id === transaction.seller_id;
      const isBuyer = user.id === transaction.buyer_id;

      if (isSeller && transaction.delivery_status !== 'delivered') {
        throw new Error('Sellers can only open disputes after marking delivery');
      }

      if (isBuyer && transaction.delivery_status !== 'delivered') {
        throw new Error('Buyers can only open disputes after product is marked as delivered');
      }

      // Create dispute record
      const { error: disputeError } = await supabase
        .from('disputes')
        .insert({
          transaction_id: transactionId,
          buyer_id: transaction.buyer_id,
          seller_id: transaction.seller_id,
          initiator_id: user.id,
          reason: reason,
          status: 'pending_review',
          amount: transaction.amount,
          created_at: new Date().toISOString()
        });

      if (disputeError) throw disputeError;

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status: 'disputed' })
        .eq('id', transactionId);

      toast.success('Dispute created successfully. Admin will review the case.');
      return true;
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  }
}

