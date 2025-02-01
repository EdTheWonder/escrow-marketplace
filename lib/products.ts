import { createClient } from '@supabase/supabase-js';
import { Product } from '@/types';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function createProduct(data: {
  title: string;
  description: string;
  price: number;
  seller_id: string;
  image_urls: string[];
}) {
  // First, ensure the profile exists
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
      id: data.seller_id,
      email: user?.email,
      role: 'user',
      wallet_balance: '0'
    }, { 
      onConflict: 'id' 
    });

  if (profileError) throw profileError;

  // Then create the product
  const { error } = await supabase
    .from('products')
    .insert({
      ...data,
      status: 'available'
    });

  if (error) throw error;
}

export async function getProducts(filters?: {
  status?: string;
  seller_id?: string;
  limit?: number;
}) {
  let query = supabase
    .from('products')
    .select(`
      *,
      profiles:seller_id (
        email
      )
    `);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.seller_id) {
    query = query.eq('seller_id', filters.seller_id);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles:seller_id (
        email
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const { error } = await supabase
    .from('products')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getAvailableProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles:seller_id (
        email
      )
    `)
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}




export async function updateProductStatus(productId: string, status: string) {
  try {
    console.log('Starting product status update:', { productId, status });
    
    // First verify the product exists
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('status')
      .eq('id', productId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!product) throw new Error('Product not found');

    // Then update the status
    const { error: updateError } = await supabase
      .from('products')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
}
