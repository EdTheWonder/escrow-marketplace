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
        .select(`
          status,
          transactions!inner (
            id,
            status,
            buyer_id
          )
        `)
        .eq('id', productId)
        .single();

      if (product?.transactions) {
        router.push(`/dashboard/transactions`);
      }
    }

    checkStatus();
  }, [productId, router]);

  return null;
}
