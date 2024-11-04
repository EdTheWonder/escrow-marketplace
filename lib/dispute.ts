// lib/dispute.ts

import { supabase as supabase } from './supabase';  // Add this import at the top
// ... existing code ...

export class DisputeService {
  static async createDispute(transactionId: string) {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (!transaction) throw new Error('Transaction not found');

    const { error } = await supabase
      .from('disputes')
      .insert({
        transaction_id: transactionId,
        buyer_id: transaction.buyer_id,
        seller_id: transaction.seller_id,
        status: 'pending_review',
        amount: transaction.amount
      });

    if (error) throw error;

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'disputed' })
      .eq('id', transactionId);
  }
}

