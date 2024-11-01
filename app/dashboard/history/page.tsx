"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import BackButton from "@/components/back-button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Transaction {
  id: string;
  amount: number;
  status: string;
  products: { title: string };
  buyer: { email: string };
  seller: { email: string };
  buyer_id: string;
  seller_id: string;
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          products:product_id (*),
          buyer:buyer_id (email),
          seller:seller_id (email)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      setTransactions(data || []);
    }

    fetchHistory();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <BackButton />
      <h1 className="text-3xl font-bold mb-8">Transaction History</h1>
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No transactions yet
          </Card>
        ) : (
          transactions.map((transaction) => (
            <Card key={transaction.id} className="p-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{transaction.products.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {transaction.buyer.email === transaction.seller.email 
                      ? `You ${transaction.buyer_id === user.id ? 'bought from' : 'sold to'} ${transaction.buyer.email}`
                      : `Transaction with ${transaction.buyer.email}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${transaction.amount}</p>
                  <p className="text-sm text-muted-foreground">{transaction.status}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
