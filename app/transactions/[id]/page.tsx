"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import DeliveryStatus from "@/components/delivery/DeliveryStatus";
import EscrowChannel from "@/components/escrow-channel";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Transaction {
  id: string;
  status: string;
  delivered_at: string;
  amount: number;
  created_at: string;
  products: {
    title: string;
    image_urls: string[];
  };
  buyers: {
    email: string;
  };
  sellers: {
    email: string;
  };
}

export default function TransactionPage({ params }: { params: { id: string } }) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    async function fetchTransaction() {
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          products (title, image_urls),
          buyers:buyer_id (email),
          sellers:seller_id (email)
        `)
        .eq('id', params.id)
        .single();
      
      if (data) setTransaction(data);
    }

    fetchTransaction();
  }, [params.id]);

  if (!transaction) return null;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">{transaction.products.title}</h2>
            {transaction.products.image_urls?.[0] && (
              <img 
                src={transaction.products.image_urls[0]}
                alt={transaction.products.title}
                className="w-full rounded-lg"
              />
            )}
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Trade Details</h3>
              <p>Amount: ₦{transaction.amount}</p>
              <p>Created: {format(new Date(transaction.created_at), 'PPP')}</p>
              <p>Buyer: {transaction.buyers.email}</p>
              <p>Seller: {transaction.sellers.email}</p>
            </div>
            <DeliveryStatus 
              transactionId={transaction.id}
              status={transaction.status}
              deliveredAt={transaction.delivered_at}
            />
          </div>
        </div>
      </Card>

      <EscrowChannel 
        transactionId={transaction.id} 
        allowMediaUpload={true}
      />
    </div>
  );
}
