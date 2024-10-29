"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import DeliveryStatus from "@/components/delivery/DeliveryStatus";
import EscrowChannel from "@/components/escrow-channel";
import { Card } from "@/components/ui/card";

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
    <div className="container mx-auto py-8 space-y-6">
      {transaction && (
        <>
          <Card className="p-6">
            <DeliveryStatus 
              transactionId={transaction.id}
              status={transaction.status}
              deliveredAt={transaction.delivered_at}
            />
          </Card>

          <EscrowChannel transactionId={transaction.id} />
        </>
      )}
    </div>
  );
}
