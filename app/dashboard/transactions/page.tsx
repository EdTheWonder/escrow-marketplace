"use client";
import { useEffect, useState } from "react";
import { Transaction, getTransactionHistory, confirmDelivery, createDispute } from "@/lib/transactions";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import BackButton from "@/components/back-button";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import TransactionCountdown from "@/components/transaction-countdown";
import { Card } from "@/components/ui/card";
import ConfirmDeliveryButton from "@/components/delivery/ConfirmDeliveryButton";
import MarkAsDeliveredButton from "@/components/delivery/MarkAsDeliveredButton";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No user found in session');
          return;
        }
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setCurrentUser(user);
        const transactions = await getTransactionHistory(user.id);
        setTransactions(transactions);
      } catch (error: any) {
        console.error('Failed to load data:', error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-8">
          <p>Loading transactions...</p>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-8">
          <p>Please wait...</p>
        </Card>
      </div>
    );
  }

  async function handleCreateDispute(transactionId: string) {
    try {
      await createDispute(transactionId);
      toast.success("Dispute created! Our team will review the transaction.");
      router.push(`/dashboard/transactions/${transactionId}`);
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
            <Card className="p-8 text-center">
              <p>No transactions found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card 
                  key={transaction.id}
                  className="p-6 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => router.push(`/dashboard/transactions/${transaction.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{transaction.products.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Amount: ₦{transaction.amount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentUser.id === transaction.buyer_id
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
                      {currentUser.id === transaction.seller_id && 
                       transaction.status === 'in_escrow' &&
                       transaction.delivery_status === 'pending' && (
                        <div className="flex flex-col gap-2">
                          <MarkAsDeliveredButton
                            transactionId={transaction.id}
                            onSuccess={() => router.push(`/dashboard/transactions/${transaction.id}`)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Click this after you have delivered the product
                          </p>
                        </div>
                      )}
                      {currentUser.id === transaction.buyer_id && 
                       transaction.status === 'in_escrow' &&
                       transaction.delivery_status === 'delivered' && (
                        <div className="flex flex-col gap-2">
                          <ConfirmDeliveryButton
                            transactionId={transaction.id}
                            onSuccess={() => router.push(`/dashboard/transactions/${transaction.id}`)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Clicking this will release the payment to the seller
                          </p>
                        </div>
                      )}
                      {currentUser.id === transaction.seller_id && 
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
                   currentUser.id === transaction.seller_id && (
                    <div className="mt-2">
                      {transaction.delivery_deadline && (
                        <TransactionCountdown 
                          deadline={transaction.delivery_deadline}
                          transactionId={transaction.id}
                          isSeller={true}
                          onExpire={() => router.push(`/dashboard/transactions/${transaction.id}`)}
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
