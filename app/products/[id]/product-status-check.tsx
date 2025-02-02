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
        .single();

      if (product?.status === 'in_escrow' || product?.status === 'sold') {
        const transactionId = product.transactions[0]?.id;
        if (transactionId) {
          router.replace('/dashboard');
        }
      }
    }

    checkStatus();
  }, [productId, router]);

  return null;
}

export class TransactionTimer {
  static async handleExpiredDelivery(transactionId: string) {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('product_id')
      .eq('id', transactionId)
      .single();

    if (transaction) {
      // Update product status to available
      await supabase
        .from('products')
        .update({ status: 'available' })
        .eq('id', transaction.product_id);

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status: 'expired' })
        .eq('id', transactionId);
    }
  }
}
