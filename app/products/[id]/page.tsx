import { Suspense } from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ProductDetails from "./product-details";
import BackButton from "@/components/back-button";
import ProductStatusCheck from './product-status-check';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles (
        id,
        email
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !product) {
    console.error('Product not found:', error);
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <BackButton />
      <Suspense fallback={<div>Loading...</div>}>
        <ProductStatusCheck productId={params.id} />
        <ProductDetails product={product} />
      </Suspense>
    </div>
  );
}

