"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Trade {
  id: string;
  status: string;
  amount: number;
  created_at: string;
  product: {
    id: string;
    title: string;
    image_urls: string[];
  };
  counterparty: {
    id: string;
    email: string;
  };
}

export default function MessagesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchTrades() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          id,
          status,
          amount,
          created_at,
          products (
            id,
            title,
            image_urls
          ),
          buyers:buyer_id (id, email),
          sellers:seller_id (id, email)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .eq('status', 'in_escrow')
        .order('created_at', { ascending: false });

      if (transactions) {
        const formattedTrades = transactions.map(t => ({
          ...t,
          counterparty: user.id === t.buyers[0].id ? t.sellers[0] : t.buyers[0],
          product: t.products[0]
        }));
        setTrades(formattedTrades);
      }
    }

    fetchTrades();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="w-6 h-6" />
        Messages
      </h1>
      
      <div className="grid gap-4">
        {trades.map((trade) => (
          <Link href={`/transactions/${trade.id}`} key={trade.id}>
            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex gap-4">
                {trade.product.image_urls?.[0] && (
                  <img
                    src={trade.product.image_urls[0]}
                    alt={trade.product.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{trade.product.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {trade.counterparty.email}
                  </p>
                  <p className="text-sm">₦{trade.amount}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                      {trade.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(trade.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
        
        {trades.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            No active escrow chats
          </Card>
        )}
      </div>
    </div>
  );
}
