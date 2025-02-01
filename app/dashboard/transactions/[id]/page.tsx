"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import BackButton from "@/components/back-button";
import EscrowChannel from "@/components/escrow-channel";
import { useRouter } from "next/navigation";
import TransactionCountdown from "@/components/transaction-countdown";
import { Transaction, getTransactionById } from "@/lib/transactions";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner"; // Using sonner instead of react-hot-toast
import { User } from "@supabase/supabase-js";
import MarkAsDeliveredButton from '@/components/delivery/MarkAsDeliveredButton';
import ConfirmDeliveryButton from '@/components/delivery/ConfirmDeliveryButton';
import UserFeedback from '@/components/user-feedback';
import { Button } from "@/components/ui/button";
import { DisputeService } from "@/lib/dispute";
import { EscrowService } from "@/lib/escrow";

export default function TransactionDetailsPage({ params }: { params: { id: string } }) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        const txData = await getTransactionById(params.id);
        setTransaction(txData);
      } catch (error) {
        console.error('Error fetching transaction:', error);
        toast.error('Failed to load transaction details');
      }
    }

    fetchData();
  }, [params.id]);

  if (!transaction) return null;

  function fetchData() {
    throw new Error("Function not implemented.");
  }

  const handleCreateDispute = async (transactionId: string) => {
    try {
      const reason = prompt('Please provide a reason for opening this dispute:');
      if (!reason) return;

      await EscrowService.openDispute(transactionId, reason);
      
      toast.success('Dispute created successfully. Admin will review the case.');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create dispute');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <BackButton />
      
      {transaction && transaction.status === 'in_escrow' && (
        <>
          {/* Show countdown timer */}
          {transaction.delivery_deadline && (
            <div className="mb-6">
              <TransactionCountdown 
                deadline={transaction.delivery_deadline}
                transactionId={transaction.id}
                isSeller={currentUser?.id === transaction.seller_id}
                onExpire={() => {
                  // Refresh transaction data when timer expires
                  fetchData();
                }}
              />
            </div>
          )}

          {/* Show seller's "Mark as Delivered" button */}
          {currentUser?.id === transaction.seller_id && 
           transaction.delivery_status === 'pending' && (
            <div className="mb-6">
              <MarkAsDeliveredButton 
                transactionId={transaction.id}
                onSuccess={fetchData}
              />
            </div>
          )}

          {/* Show buyer's "Confirm Delivery" button */}
          {currentUser?.id === transaction.buyer_id && 
           transaction.delivery_status === 'delivered' && (
            <div className="mb-6">
              <ConfirmDeliveryButton
                transactionId={transaction.id}
                onSuccess={fetchData}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Clicking this will release the payment to the seller
              </p>
            </div>
          )}

          {/* Add dispute button for both buyer and seller */}
          {transaction && transaction.status === 'in_escrow' && 
           transaction.delivery_status === 'delivered' && (
            <div className="mb-6">
              <Button
                onClick={() => handleCreateDispute(transaction.id)}
                variant="destructive"
                className="w-full"
              >
                Open Dispute
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                {currentUser?.id === transaction.seller_id 
                  ? "Open dispute if buyer hasn't confirmed delivery"
                  : "Open dispute if there's an issue with the delivered product"}
              </p>
            </div>
          )}
        </>
      )}

      {transaction && transaction.status === 'sold' && !transaction.feedback_submitted && (
        <div className="mb-6">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Leave Feedback</h3>
            <UserFeedback 
              userId={currentUser?.id === transaction.buyer_id ? transaction.seller_id : transaction.buyer_id}
              transactionId={transaction.id}
            />
          </Card>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
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
                <p className="text-sm text-muted-foreground">Delivery Method</p>
                <p className="font-medium capitalize">{transaction.delivery_method}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Status</p>
                <p className="font-medium capitalize">{transaction.delivery_status}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Chat</h2>
            <p className="text-sm text-muted-foreground">
              Chat with {currentUser?.email === transaction.buyer.email
                ? transaction.seller.email
                : transaction.buyer.email}
            </p>
          </div>
          <EscrowChannel 
            transactionId={transaction.id}
            allowMediaUpload={true}
          />
        </Card>
      </div>
    </div>
  );
} 