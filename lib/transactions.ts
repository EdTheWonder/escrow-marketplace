import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function createTransaction(data: {
  product_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  payment_reference: string;
}) {
  const { error } = await supabase
    .from('transactions')
    .insert({
      ...data,
      status: 'pending'
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

