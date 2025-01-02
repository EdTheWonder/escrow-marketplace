"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackButton from "@/components/back-button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Transaction {
  id: string;
  status: string;
  products: {
    title: string;
  }[];
  buyer: {
    email: string;
  };
  seller: {
    email: string;
  };
  messages: {
    content: string;
    created_at: string;
    read_at: string | null;
    recipient_id: string;
  }[];
}

export default function MessagesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchTransactions() {
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
          products (title),
          buyer:buyer_id (email),
          seller:seller_id (email),
          messages (
            content,
            created_at,
            read_at,
            recipient_id
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (data) {
        setTransactions(data.map(transaction => ({
          ...transaction,
          buyer: transaction.buyer?.[0] || {},
          seller: transaction.seller?.[0] || {},
          products: Array.isArray(transaction.products) ? transaction.products : [transaction.products],
          messages: transaction.messages || []
        })));
      }
    }

    fetchTransactions();
  }, [router]);

  return (
    <div className="container mx-auto py-8 px-4">
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">Escrow Chats</h1>
      <div className="space-y-4">
        {transactions.map((transaction) => {
          const lastMessage = transaction.messages?.[transaction.messages.length - 1];
          const unreadCount = transaction.messages?.filter(
            msg => msg.recipient_id === currentUser?.id && !msg.read_at
          ).length || 0;
          const otherPartyEmail = currentUser?.email === transaction.buyer?.email 
            ? transaction.seller?.email 
            : transaction.buyer?.email;

          return (
            <Link href={`/dashboard/transactions/${transaction.id}`} key={transaction.id}>
              <Card className="p-4 hover:bg-accent transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{transaction.products[0].title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {otherPartyEmail}
                    </p>
                    <p className="text-sm mt-1">
                      {lastMessage?.content || 'No messages yet'}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                      {transaction.status}
                    </span>
                  </div>
                  <div className="text-right">
                    {lastMessage && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(lastMessage.created_at), 'MMM d, HH:mm')}
                      </p>
                    )}
                    {unreadCount > 0 && (
                      <span className="inline-block bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs mt-1">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
