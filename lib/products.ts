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

export async function getProducts() {
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
