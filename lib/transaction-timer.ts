import { DisputeService } from "./dispute";
import { EscrowService } from "./escrow";
import { supabaseClient as supabase } from './supabase';  // Add this import at the top

// lib/transaction-timer.ts
export class TransactionTimer {
  static startEscrowTimer(id: any) {
    throw new Error("Method not implemented.");
  }
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
}

