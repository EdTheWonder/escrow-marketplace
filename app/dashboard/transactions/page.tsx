"use client";
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import BackButton from "@/components/back-button";
import { format } from 'date-fns';
import TransactionCountdown from "@/components/transaction-countdown";
import { useRouter } from 'next/navigation';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface Transaction {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: string;
  escrow_wallets?: {
    status: string;
    delivery_deadline: string;
  };
  products: {
    title: string;
    image_urls: string[];
    status: string;
  };
  buyer: {
    email: string;
  };
  seller: {
    email: string;
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    getTransactions();
  }, []);

  async function getTransactions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);

      const { data, error } = await supabase
        .from('user_transactions')
        .select(`
          *,
          products (*),
          buyer:buyer_id (email),
          seller:seller_id (email),
          escrow_wallets!left (
            status,
            delivery_deadline
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      if (data) {
        setTransactions(data);
      }
    }
  }

  async function handleConfirmDelivery(transactionId: string) {
    try {
      const response = await fetch('/api/delivery/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to confirm delivery');
      }

      toast.success("Delivery confirmed! Payment released to seller.");
      router.push('/products');
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleCreateDispute(transactionId: string) {
    try {
      const response = await fetch('/api/transactions/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create dispute');
      }

      toast.success("Dispute created! Our team will review the transaction.");
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
          {transactions.length === 0 ? (
            <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border border-white/20">
              <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
              <p className="text-muted-foreground">Your transaction history will appear here</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="p-4 bg-white/80 backdrop-blur-sm border border-white/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{transaction.products.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Amount: ₦{transaction.amount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.id === transaction.buyer_id
                          ? `Seller: ${transaction.seller.email}`
                          : `Buyer: ${transaction.buyer.email}`}
                      </p>
                      {transaction.escrow_wallets && (
                        <p className="text-sm text-muted-foreground">
                          Escrow Status: {transaction.escrow_wallets.status}
                          {transaction.escrow_wallets.delivery_deadline && (
                            <span className="ml-2">
                              (Deadline: {format(new Date(transaction.escrow_wallets.delivery_deadline), 'PPp')})
                            </span>
                          )}
                        </p>
                      )}
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
                      {user.id === transaction.seller_id && 
                       transaction.status === 'in_escrow' && 
                       transaction.escrow_wallets?.delivery_deadline && 
                       new Date(transaction.escrow_wallets.delivery_deadline) < new Date() && (
                        <Button
                          onClick={() => handleCreateDispute(transaction.id)}
                          size="sm"
                          variant="destructive"
                        >
                          Open Dispute
                        </Button>
                      )}
                    </div>
                  </div>
                  {transaction.escrow_wallets && transaction.status === 'in_escrow' && (
                    <div className="mt-2">
                      <TransactionCountdown 
                        deadline={transaction.escrow_wallets.delivery_deadline}
                        onExpire={() => getTransactions()}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
