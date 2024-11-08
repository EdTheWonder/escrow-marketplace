import { createClient } from '@supabase/supabase-js';
import { EscrowService } from './escrow';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function confirmDelivery(transactionId: string) {
  try {
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) throw new Error('Transaction not found');

    // Release payment to seller
    await EscrowService.releaseToSeller(transactionId);

    // Product status is updated through releaseToSeller
    return { 
      success: true,
      transaction 
    };
  } catch (error) {
    console.error('Delivery confirmation error:', error);
    throw error;
  }
}
