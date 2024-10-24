"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import DeliveryStatus from "@/components/delivery/DeliveryStatus";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface Transaction {
  id: string;
  status: string;
  delivered_at: string;
}

export default function TransactionPage({ params }: { params: { id: string } }) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    async function fetchTransaction() {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (data) setTransaction(data);
    }

    fetchTransaction();
  }, [params.id]);

  return (
    <div>
      {transaction && (
        <DeliveryStatus 
          transactionId={transaction.id}
          status={transaction.status}
          deliveredAt={transaction.delivered_at}
        />
      )}
    </div>
  );
}
