"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import EscrowChannel from "@/components/escrow-channel";
import { Card } from "@/components/ui/card";
import BackButton from "@/components/back-button";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Transaction {
  id: string;
  status: string;
  products: {
    title: string | null;
  }[];
  buyers: {
    email: any | null;
  }[];
  sellers: {
    email: any | null;
  }[];
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
          products: data.products ? [{ 
            title: data.products?.[0]?.title || null 
          }] : [],
          buyers: [{
            email: data.buyer?.[0]?.email || null
          }],
          sellers: [{
            email: data.seller?.[0]?.email || null
          }]
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
            {transaction.products[0]?.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            Chat with {currentUser?.email === transaction.buyers[0].email
              ? transaction.sellers[0].email
              : transaction.buyers[0].email}
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
