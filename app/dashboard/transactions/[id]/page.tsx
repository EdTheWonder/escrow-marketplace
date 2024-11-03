"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Card } from "@/components/ui/card";
import BackButton from "@/components/back-button";
import { format } from "date-fns";
import EscrowChannel from "@/components/escrow-channel";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TransactionDetailsPage({ params }: { params: { id: string } }) {
  const [transaction, setTransaction] = useState<any>(null);

  useEffect(() => {
    async function fetchTransaction() {
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          products (*),
          buyer:buyer_id (email, wallet_balance),
          seller:seller_id (email, wallet_balance),
          escrow_wallets (*),
          messages (*)
        `)
        .eq('id', params.id)
        .single();

      if (data) {
        setTransaction(data);
      }
    }

    fetchTransaction();
  }, [params.id]);

  if (!transaction) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <BackButton />
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Transaction Details</h1>
        
        <Card className="p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{transaction.products.title}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium">₦{transaction.amount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{transaction.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Buyer</p>
                <p className="font-medium">{transaction.buyer.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seller</p>
                <p className="font-medium">{transaction.seller.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(transaction.created_at), 'PPp')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="font-medium">
                  {transaction.completed_at 
                    ? format(new Date(transaction.completed_at), 'PPp')
                    : 'Not completed'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Chat History</h2>
          <EscrowChannel 
            transactionId={transaction.id}
            allowMediaUpload={false}
          />
        </Card>
      </div>
    </div>
  );
} 