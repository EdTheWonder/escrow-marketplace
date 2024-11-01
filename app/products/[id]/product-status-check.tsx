"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProductStatusCheck({ productId }: { productId: string }) {
  const router = useRouter();
  
  useEffect(() => {
    async function checkStatus() {
      const { data: product } = await supabase
        .from('products')
        .select('status, transactions(id)')
        .eq('id', productId)
        .single();

      if (product?.status === 'in_escrow' && product.transactions?.[0]) {
        router.push(`/transactions/${product.transactions[0].id}`);
      }
    }

    checkStatus();
  }, [productId, router]);

  return null;
}
