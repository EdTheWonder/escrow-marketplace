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
  transactions: any;
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: string;
  delivery_method: string;
  delivery_fee: number;
  delivery_status: string;
  created_at: string;
  completed_at?: string;
  delivery_deadline?: string;
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        console.log('User profile:', profile);
        setUser({ ...user, ...profile });

        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            products!transactions_product_id_fkey (*),
            buyer:profiles!buyer_id (*),
            seller:profiles!seller_id (*),
            messages (*)
          `)
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .in('status', ['in_escrow', 'pending_feedback', 'sold'])
          .order('created_at', { ascending: false });

        console.log('Transactions fetch response:', { data, error });

        if (error) {
          console.error('Supabase error:', error);
          return;
        }

        if (data) {
          console.log('Setting transactions:', data);
          setTransactions(data);
        }
      }
    } catch (error) {
      console.error('Error in getTransactions:', error);
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
      getTransactions();
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

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'available':
        return { text: 'Available', color: 'var(--success)' };
      case 'in_escrow':
        return { text: 'In Escrow', color: 'var(--warning)' };
      case 'pending_feedback':
        return { text: 'Pending Feedback', color: 'var(--warning)' };
      case 'sold':
        return { text: 'Trade Completed', color: 'var(--muted)' };
      default:
        return { text: status, color: 'var(--muted)' };
    }
  };

  const handleTransactionClick = (transactionId: string) => {
    router.push(`/dashboard/transactions/${transactionId}`);
  };

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
                <Card 
                  key={transaction.id}
                  className="p-6 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleTransactionClick(transaction.id)}
                >
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
                      <p className="text-sm text-muted-foreground">
                        Delivery Method: {transaction.delivery_method}
                        {transaction.delivery_fee > 0 && (
                          <span className="ml-2">
                            (Fee: ₦{transaction.delivery_fee})
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Delivery Status: {transaction.delivery_status}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 rounded text-sm mb-2"
                        style={{
                          backgroundColor: getStatusDisplay(transaction.status).color,
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
                       transaction.delivery_deadline && 
                       new Date(transaction.delivery_deadline) < new Date() && (
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
                  {transaction.status && 
                   transaction.status === 'in_escrow' && 
                   user.id === transaction.seller_id && (
                    <div className="mt-2">
                      {transaction.delivery_deadline && (
                        <TransactionCountdown 
                          deadline={transaction.delivery_deadline}
                          transactionId={transaction.id}
                          isSeller={true}
                          onExpire={() => getTransactions()}
                        />
                      )}
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
