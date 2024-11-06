import { createClient } from '@supabase/supabase-js';
import { EscrowService } from './escrow';
import { updateProductStatus } from './products';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type DeliveryMethod = 'meetup' | 'sendbox';
export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered';
export type TransactionStatus = 'pending' | 'in_escrow' | 'pending_feedback' | 'sold' | 'refunded' | 'disputed';

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
  delivery_method: DeliveryMethod;
  delivery_fee: number;
}) {
  // First check product status
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('status')
    .eq('id', data.product_id)
    .single();

  if (productError) throw productError;
  if (!product) throw new Error('Product not found');
  if (product.status !== 'available') {
    throw new Error('This product is not available for purchase');
  }

  // Then check for existing transactions
  const { data: existingTransaction } = await supabase
    .from('transactions')
    .select('id')
    .eq('product_id', data.product_id)
    .in('status', ['pending', 'in_escrow'])
    .single();

  if (existingTransaction) {
    throw new Error('This product already has an active transaction');
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      ...data,
      status: 'pending',
      delivery_status: 'pending',
      payment_reference: null
    })
    .select()
    .single();

  if (error) throw error;
  return transaction;
}

export async function updateTransactionStatus(id: string, status: string) {
  const { error } = await supabase
    .rpc('sync_transaction_product_status', {
      p_transaction_id: id,
      p_status: status
    });

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
    .in('status', ['in_escrow', 'sold'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateTransactionToEscrow(transactionId: string) {
  try {
    // Get product_id from transaction first
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('product_id')
      .eq('id', transactionId)
      .single();

    if (txError) throw txError;
    if (!transaction) throw new Error('Transaction not found');

    // Use the sync method to update both statuses
    await EscrowService.syncProductAndTransactionStatus(
      transaction.product_id,
      transactionId,
      'in_escrow'
    );
  } catch (error) {
    console.error('Failed to update to escrow:', error);
    throw error;
  }
}

export async function handlePaymentVerification(transactionId: string) {
  try {
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*, products(*)')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) throw new Error('Transaction not found');

    // Direct database updates in a transaction
    const { error: updateError } = await supabase.rpc('update_transaction_and_product', {
      p_transaction_id: transactionId,
      p_product_id: transaction.product_id,
      p_status: 'in_escrow'
    });

    if (updateError) {
      console.error('Status update error:', updateError);
      throw updateError;
    }

    // Create escrow wallet entry
    await EscrowService.createEscrowWallet(transactionId, transaction.amount);

    return transaction;
  } catch (error) {
    console.error('Payment verification handling error:', error);
    throw error;
  }
}
