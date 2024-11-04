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
  messages?: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    recipient_id: string;
    read_at: string;
    media_url?: string;
    media_type?: string;
  }[];
}

export default function TransactionDetailsPage({ params }: { params: { id: string } }) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('Current user:', user);
        
        if (userError) {
          console.error('User auth error:', userError);
          router.push('/auth/login');
          return;
        }

        if (!user) {
          console.log('No user found');
          router.push('/auth/login');
          return;
        }
        
        setCurrentUser(user);

        const { data, error } = await supabase
          .from('transactions')
          .select(`
            id,
            status,
            amount,
            delivery_method,
            delivery_fee,
            delivery_status,
            products (
              title,
              status
            ),
            buyer:users!transactions_buyer_id_fkey (
              email
            ),
            seller:users!transactions_seller_id_fkey (
              email
            ),
            messages (
              id,
              content,
              created_at,
              sender_id,
              recipient_id,
              read_at,
              media_url,
              media_type
            )
          `)
          .eq('id', params.id)
          .single();

        console.log('Transaction fetch response:', { data, error });

        if (error) {
          console.error('Transaction fetch error:', error);
          return;
        }

        if (data) {
          console.log('Setting transaction:', data);
          setTransaction({
            id: data.id,
            status: data.status,
            amount: data.amount,
            delivery_method: data.delivery_method,
            delivery_fee: data.delivery_fee,
            delivery_status: data.delivery_status,
            products: {
              title: data.products[0]?.title || ''
            },
            buyer: {
              email: data.buyer[0]?.email || ''
            },
            seller: {
              email: data.seller[0]?.email || ''
            },
            messages: data.messages?.map(msg => ({
              id: msg.id,
              content: msg.content,
              created_at: msg.created_at,
              sender_id: msg.sender_id,
              recipient_id: msg.recipient_id,
              read_at: msg.read_at,
              media_url: msg.media_url,
              media_type: msg.media_type
            }))
          });
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
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