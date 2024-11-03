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
          transactions (
            id,
            status,
            buyer_id
          )
        `)
        .eq('id', productId)
        .order('created_at', { ascending: false })
        .single();

      if (product?.status === 'in_escrow' || product?.status === 'sold') {
        router.push(`/dashboard/transactions`);
      }
    }

    checkStatus();
  }, [productId, router]);

  return null;
}
