"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import EscrowChannel from "@/components/escrow-channel";
import { Card } from "@/components/ui/card";
import BackButton from "@/components/back-button";
import { useRouter } from "next/navigation";



interface Transaction {
  id: string;
  status: string;
  products: {
    title: string;
  };
  buyer: {
    email: string;
  };
  seller: {
    email: string;
  };
}

export default function ChatPage({ params }: { params: { transactionId: string } }) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setCurrentUser(user);

      const { data } = await supabase
        .from('transactions')
        .select(`
          id,
          status,
          products (
            title
          ),
          buyer:profiles!buyer_id (
            email
          ),
          seller:profiles!seller_id (
            email
          )
        `)
        .eq('id', params.transactionId)
        .single();
      
      if (data) {
        const transactionData: Transaction = {
          id: data.id,
          status: data.status,
          products: {
            title: data.products[0]?.title || ''
          },
          buyer: {
            email: data.buyer[0]?.email || ''
          },
          seller: {
            email: data.seller[0]?.email || ''
          }
        };
        setTransaction(transactionData);
      }
    }

    fetchData();
  }, [params.transactionId, router]);

  if (!transaction) return null;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <BackButton />
      <Card className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            {transaction.products.title}
          </h2>
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
  );
}
