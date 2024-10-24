import { createClient } from '@supabase/supabase-js';
import { WalletManager } from './wallet';
import { EscrowService } from './escrow';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function confirmDelivery(transactionId: string) {
  try {
    await EscrowService.releaseToSeller(transactionId);
    return { success: true };
  } catch (error) {
    console.error('Delivery confirmation error:', error);
    throw error;
  }
}
