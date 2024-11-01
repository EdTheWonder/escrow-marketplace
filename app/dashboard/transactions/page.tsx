"use client";
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import BackButton from "@/components/back-button";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface Transaction {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: string;
  products: {
    title: string;
  };
  buyers: {
    email: string;
  };
  sellers: {
    email: string;
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getTransactions();
  }, []);

  async function getTransactions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);

      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          products:product_id (title),
          buyers:buyer_id (email),
          sellers:seller_id (email)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (data) setTransactions(data);
    }
  }

  async function handleConfirmDelivery(transactionId: string) {
    try {
      const response = await fetch('/api/transactions/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to confirm delivery');
      }

      toast.success("Delivery confirmed! Payment released to seller.");
      getTransactions();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <BackButton />
      <div className="min-h-screen p-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold mb-6">Transactions</h1>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="p-4 bg-white/80 backdrop-blur-sm border border-white/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{transaction.products.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Amount: ${transaction.amount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.id === transaction.buyer_id
                        ? `Seller: ${transaction.sellers.email}`
                        : `Buyer: ${transaction.buyers.email}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 rounded text-sm mb-2"
                      style={{
                        backgroundColor: 
                          transaction.status === 'completed' ? 'var(--success)' :
                          transaction.status === 'in_escrow' ? 'var(--warning)' :
                          'var(--muted)',
                        color: 'white'
                      }}
                    >
                      {transaction.status}
                    </span>
                    {user.id === transaction.buyer_id && 
                     transaction.status === 'in_escrow' && (
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleConfirmDelivery(transaction.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          I have received and am satisfied with the product
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Clicking this will release the payment to the seller
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
