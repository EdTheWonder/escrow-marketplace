import { DisputeService } from "./dispute";
import { EscrowService } from "./escrow";
import { supabase } from './supabase';  // Add this import at the top
import { toast } from 'sonner';

// lib/transaction-timer.ts
export class TransactionTimer {
  static async startPaymentTimer(transactionId: string) {
    const THREE_HOURS = 3 * 60 * 60 * 1000;
    
    setTimeout(async () => {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('status')
        .eq('id', transactionId)
        .single();

      if (transaction?.status === 'pending') {
        await EscrowService.processRefund(transactionId);
      }
    }, THREE_HOURS);
  }

  static async startDeliveryTimer(transactionId: string) {
    const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    
    try {
      // Set delivery deadline in the database
      const deadline = new Date(Date.now() + TWELVE_HOURS);
      const { error } = await supabase
        .from('transactions')
        .update({ 
          delivery_deadline: deadline.toISOString(),
          status: 'in_escrow'
        })
        .eq('id', transactionId);

      if (error) throw error;

      return deadline;
    } catch (error) {
      console.error('Failed to start delivery timer:', error);
      throw error;
    }
  }

  static async startEscrowTimer(transactionId: string) {
    const ESCROW_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hours
    
    setTimeout(async () => {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('status')
        .eq('id', transactionId)
        .single();

      if (transaction?.status === 'in_escrow') {
        await EscrowService.processRefund(transactionId);
        toast.info('Escrow period expired. Processing refund...');
      }
    }, ESCROW_TIMEOUT);
  }

  static async handleDeliveryConfirmation(transactionId: string) {
    await supabase
      .from('transactions')
      .update({ 
        delivery_status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', transactionId);
  }
}

