"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import EscrowChannel from '@/components/escrow-channel';
import { format } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Chat {
  transaction_id: string;
  last_message: string;
  last_message_time: string;
  product: {
    title: string;
    price: number;
  };
  other_party: {
    email: string;
  };
}

export default function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchChats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          id,
          products (title, price),
          buyers:buyer_id (email),
          sellers:seller_id (email),
          messages (content, created_at)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .eq('status', 'in_escrow');

      if (transactions) {
        const formattedChats = transactions.map(t => ({
          transaction_id: t.id,
          last_message: t.messages?.[t.messages.length - 1]?.content || 'No messages yet',
          last_message_time: t.messages?.[t.messages.length - 1]?.created_at,
          product: t.products[0], // Get first product since interface expects single product
          other_party: user.id === t.id ? t.sellers[0] : t.buyers[0] // Access first buyer/seller and use t.id
        }));
        setChats(formattedChats);
      }
    }

    fetchChats();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          {chats.map((chat) => (
            <Card
              key={chat.transaction_id}
              className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                selectedChat === chat.transaction_id ? 'bg-muted' : ''
              }`}
              onClick={() => setSelectedChat(chat.transaction_id)}
            >
              <h3 className="font-semibold">{chat.product.title}</h3>
              <p className="text-sm text-muted-foreground">
                {chat.other_party.email}
              </p>
              <p className="text-sm truncate">{chat.last_message}</p>
              {chat.last_message_time && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(chat.last_message_time), 'MMM d, HH:mm')}
                </p>
              )}
            </Card>
          ))}
        </div>
        
        <div className="col-span-2">
          {selectedChat ? (
            <EscrowChannel 
              transactionId={selectedChat}
              allowMediaUpload={true}
            />
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              Select a chat to view messages
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
