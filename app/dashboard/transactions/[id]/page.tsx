"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import BackButton from "@/components/back-button";
import EscrowChannel from "@/components/escrow-channel";
import { useRouter } from "next/navigation";
import TransactionCountdown from "@/components/transaction-countdown";
import { Transaction, getTransactionById } from "@/lib/transactions";
import { supabase } from "@/lib/supabase";

export default function TransactionDetailsPage({ 
  params,
  searchParams 
}: { 
  params: { id: string },
  searchParams: { [key: string]: string | undefined }
}) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  async function fetchData() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        router.push('/auth/login');
        return;
      }
      
      setCurrentUser(user);
      const data = await getTransactionById(params.id);
      setTransaction(data);
    } catch (error) {
      console.error('Error fetching transaction:', error);
    }
  }

  useEffect(() => {
    fetchData();
  }, [params.id]);

  if (!transaction) return null;



  return (
    <div className="container mx-auto py-8 px-4">
      <BackButton postPayment={searchParams?.from === 'payment'} />
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

        {transaction?.status === 'in_escrow' && transaction.delivery_deadline && (
          <div className="my-4">
            <TransactionCountdown 
              deadline={transaction.delivery_deadline}
              transactionId={transaction.id}
              isSeller={currentUser?.email === transaction.seller.email}
              onExpire={() => {
                fetchData();
              }}
            />
          </div>
        )}

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