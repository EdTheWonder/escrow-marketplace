import { createClient } from '@supabase/supabase-js';
import { EscrowService } from './escrow';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type DeliveryMethod = 'meetup' | 'sendbox';
export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered';
export type TransactionStatus = 'pending' | 'in_escrow' | 'sold' | 'refunded' | 'disputed';

export interface Transaction {
  id: string;
  status: TransactionStatus;
  amount: number;
  delivery_method: DeliveryMethod;
  delivery_fee: number;
  delivery_status: DeliveryStatus;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  completed_at?: string;
  delivery_deadline?: string;
  products: {
    title: string;
    image_urls?: string[];
    status: string;
  };
  buyer: {
    email: string;
  };
  seller: {
    email: string;
  };
  messages?: {
    content: string;
    created_at: string;
    read_at: string | null;
    recipient_id: string;
  }[];
}

export async function createTransaction(data: {
  product_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  payment_reference: string;
  delivery_method: DeliveryMethod;
  delivery_fee: number;
}) {
  const { error } = await supabase
    .from('transactions')
    .insert({
      ...data,
      status: 'pending',
      delivery_status: 'pending'
    });

  if (error) throw error;

  // Update product status
  await supabase
    .from('products')
    .update({ status: 'pending' })
    .eq('id', data.product_id);
}

export async function updateTransactionStatus(id: string, status: string) {
  const { error } = await supabase
    .from('transactions')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function getTransactionHistory(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      products (*),
      buyers:buyer_id (email),
      sellers:seller_id (email)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}


export async function updateTransactionToEscrow(transactionId: string) {
  const { error } = await supabase
    .from('transactions')
    .update({ status: 'in_escrow' })
    .eq('id', transactionId);

  if (error) throw error;
}
