"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import EscrowChannel from '@/components/escrow-channel';
import { format } from 'date-fns';
import Link from 'next/link';

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
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchTrades() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data } = await supabase
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
        .order('created_at', { ascending: false });

      if (data) {
        const formattedTrades = data.map(t => ({
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
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          {trades.map((trade) => (
            <Link href={`/transactions/${trade.id}`} key={trade.id}>
              <Card className="p-4 cursor-pointer hover:bg-muted transition-colors">
                <div className="flex gap-4">
                  {trade.product.image_urls?.[0] && (
                    <img
                      src={trade.product.image_urls[0]}
                      alt={trade.product.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{trade.product.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {trade.counterparty.email}
                    </p>
                    <p className="text-sm">Amount: ₦{trade.amount}</p>
                    <span className="text-xs px-2 py-1 rounded bg-muted">
                      {trade.status}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
