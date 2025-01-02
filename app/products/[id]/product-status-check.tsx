"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";

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
        const transactionId = product.transactions[0]?.id;
        if (transactionId) {
          router.push(`/dashboard/transactions/${transactionId}`);
        }
      }
    }

    checkStatus();
  }, [productId, router]);

  return null;
}
