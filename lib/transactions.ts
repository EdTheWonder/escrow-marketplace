import { supabase } from './supabase';
import { EscrowService } from './escrow';
import { updateProductStatus } from './products';

export type DeliveryMethod = 'meetup' | 'sendbox';
export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered';
export type TransactionStatus = 'pending' | 'in_escrow' | 'pending_feedback' | 'sold' | 'refunded' | 'disputed';
export type ProductStatus = 'available' | 'in_escrow' | 'sold';

export interface Transaction {
  feedback_submitted: any;
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
  console.log('Starting transaction creation:', data);
  try {
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

    if (error) {
      console.error('Transaction creation failed:', error);
      throw error;
    }
    
    console.log('Transaction created successfully:', transaction);
    return transaction;
  } catch (error) {
    console.error('Transaction creation error:', error);
    throw error;
  }
}

export async function updateTransactionStatus(productId: string, transactionId: string, status: string) {
  const { error } = await supabase
    .rpc('sync_product_transaction_status', {
      p_product_id: productId,
      p_transaction_id: transactionId,
      p_status: status
    });

  if (error) throw error;
}

export async function getTransactionHistory(userId: string) {
  console.log('=== Starting getTransactionHistory ===', { userId });
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        products!transactions_product_id_fkey (
          title,
          status
        ),
        buyer:buyer_id (
          email
        ),
        seller:seller_id (
          email
        )
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    console.log('Transaction fetch result:', {
      success: !!data,
      count: data?.length,
      error: error?.message
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('=== getTransactionHistory failed ===', error);
    throw error;
  }
}

export async function updateTransactionToEscrow(transactionId: string) {
  try {
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
      .select('product_id, amount')
      .eq('id', transactionId)
      .single();

    if (txError) throw txError;
    if (!transaction) throw new Error('Transaction not found');

    // Use EscrowService to handle both status updates and wallet creation
    await EscrowService.holdPayment(transactionId, transaction.amount);

    return transaction;
  } catch (error) {
    console.error('Payment verification handling error:', error);
    throw error;
  }
}

export async function getTransactionById(id: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      products!transactions_product_id_fkey (
        title,
        status
      ),
      buyer:buyer_id (
        email
      ),
      seller:seller_id (
        email
      ),
      messages (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function confirmDelivery(transactionId: string) {
  console.log('=== Starting confirmDelivery ===');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', !!user);

    if (!user) {
      throw new Error('Authentication required');
    }

    // Get transaction with logging
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select(`
        *,
        products!transactions_product_id_fkey (
          title,
          status
        ),
        seller:seller_id (
          id,
          email
        )
      `)
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.buyer_id !== user.id) {
      throw new Error('Only the buyer can confirm delivery');
    }

    // Release payment to seller
    await EscrowService.releaseToSeller(transactionId);

    return { success: true, status: 'completed', delivery_status: 'delivered' };
  } catch (error: any) {
    console.error('=== confirmDelivery failed ===', error);
    throw error;
  }
}

export async function createDispute(transactionId: string) {
  const response = await fetch('/api/transactions/dispute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create dispute');
  }

  return response.json();
}
