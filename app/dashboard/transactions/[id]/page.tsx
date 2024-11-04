"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Card } from "@/components/ui/card";
import BackButton from "@/components/back-button";
import EscrowChannel from "@/components/escrow-channel";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Transaction {
  id: string;
  status: string;
  amount: number;
  delivery_method: string;
  delivery_fee: number;
  delivery_status: string;
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

export default function TransactionDetailsPage({ params }: { params: { id: string } }) {
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
          amount,
          delivery_method,
          delivery_fee,
          delivery_status,
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
        .eq('id', params.id)
        .single();

      if (data) {
        setTransaction({
          id: data.id,
          status: data.status,
          amount: data.amount,
          delivery_method: data.delivery_method,
          delivery_fee: data.delivery_fee,
          delivery_status: data.delivery_status,
          products: data.products[0], // Take first product since type expects single product
          buyer: data.buyer[0], // Take first buyer since type expects single buyer
          seller: data.seller[0] // Take first seller since type expects single seller
        });
      }
    }

    fetchData();
  }, [params.id, router]);

  if (!transaction) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <BackButton />
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