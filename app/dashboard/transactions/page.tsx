"use client";
import { useEffect, useState } from "react";
import { Transaction, getTransactionHistory, createDispute } from "@/lib/transactions";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import BackButton from "@/components/back-button";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import TransactionCountdown from "@/components/transaction-countdown";
import { Card } from "@/components/ui/card";
import ConfirmDeliveryButton from "@/components/delivery/ConfirmDeliveryButton";
import FeedbackDialog from "@/components/feedback/FeedbackDialog";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    
    async function loadTransactions() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;
        
        if (!user) {
          router.push('/auth/login');
          return;
        }
        
        setCurrentUser(user);
        const data = await getTransactionHistory(user.id);
        if (mounted) {
          setTransactions(data);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        toast.error('Failed to load transactions');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTransactions();
    return () => { mounted = false };
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <BackButton />
        <div className="min-h-screen p-4">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">Transactions</h1>
            <Card className="p-8 text-center">
              <p>Loading transactions...</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

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
      case 'completed':
        return { text: 'Completed', color: 'var(--success)' };
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
                      {currentUser.id === transaction.buyer_id && 
                       transaction.status === 'in_escrow' && (
                        <div className="flex flex-col gap-2">
                          <ConfirmDeliveryButton
                            transactionId={transaction.id}
                            userId={currentUser.id}
                            onSuccess={() => {
                              toast.success("Delivery confirmed! Payment released to seller.");
                              router.refresh();
                            }}
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
                      {currentUser.id === transaction.buyer_id && 
                       transaction.status === 'pending_feedback' && (
                        <div className="flex flex-col gap-2">
                          <FeedbackDialog
                            isOpen={true}
                            onClose={() => router.refresh()}
                            transactionId={transaction.id}
                            recipientId={transaction.seller_id}
                            recipientRole="seller"
                          />
                          <p className="text-xs text-muted-foreground">
                            Please leave feedback for the seller
                          </p>
                        </div>
                      )}
                      {currentUser.id === transaction.seller_id && 
                       transaction.status === 'pending_feedback' && (
                        <div className="flex flex-col gap-2">
                          <FeedbackDialog
                            isOpen={true}
                            onClose={() => router.refresh()}
                            transactionId={transaction.id}
                            recipientId={transaction.buyer_id}
                            recipientRole="buyer"
                          />
                          <p className="text-xs text-muted-foreground">
                            Please leave feedback for the buyer
                          </p>
                        </div>
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
