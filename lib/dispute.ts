// lib/dispute.ts

import { supabase } from './supabase';
import { toast } from 'sonner';

export class DisputeService {
  static async createDispute(transactionId: string) {
    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*, delivery_deadline')
        .eq('id', transactionId)
        .single();

      if (!transaction) throw new Error('Transaction not found');

      // Check if delivery deadline has passed
      const now = new Date();
      const deadline = new Date(transaction.delivery_deadline);
      
      if (now < deadline) {
        throw new Error('Cannot create dispute before delivery deadline');
      }

      // Create dispute record
      const { error: disputeError } = await supabase
        .from('disputes')
        .insert({
          transaction_id: transactionId,
          buyer_id: transaction.buyer_id,
          seller_id: transaction.seller_id,
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
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  }
}

