import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

export async function createProduct(data: {
  title: string;
  description: string;
  price: number;
  seller_id: string;
  image_urls: string[];
}) {
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
    .update(data)
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
