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
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    
    setTimeout(async () => {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('status, delivery_proof')
        .eq('id', transactionId)
        .single();

      if (transaction?.status === 'in_escrow' && !transaction.delivery_proof) {
        await EscrowService.processRefund(transactionId);
      } else if (transaction?.status === 'in_escrow' && transaction.delivery_proof) {
        await DisputeService.createDispute(transactionId);
      }
    }, TWELVE_HOURS);
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
}

