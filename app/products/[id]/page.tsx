"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import ProductDetails from "./product-details";
import BackButton from "@/components/back-button";

// Add this line to force dynamic rendering
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  useEffect(() => {
    async function checkProductStatus() {
      const { data: product } = await supabase
        .from('products')
        .select('status, transactions(id)')
        .eq('id', params.id)
        .single();

      if (product?.status === 'in_escrow' && product.transactions?.[0]) {
        router.push(`/transactions/${product.transactions[0].id}`);
      }
    }

    checkProductStatus();
  }, [params.id, router]);

  const { data: product, error } = await createServerSupabase()
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
      <ProductDetails product={product} />
    </div>
  );
}

