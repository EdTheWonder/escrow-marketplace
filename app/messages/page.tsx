"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ChatPreview {
  transactionId: string;
  productTitle: string;
  otherPartyEmail: string;
  lastMessage: string | null;
  lastMessageTime: string;
  unreadCount: number;
  status: string;
}

export default function MessagesPage() {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchChats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get all transactions regardless of message existence
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          id,
          status,
          created_at,
          products (title),
          buyer:buyer_id (id, email),
          seller:seller_id (id, email),
          messages (
            content,
            created_at,
            read_at,
            recipient_id
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!transactions) return;

      const chatPreviews = transactions.map(transaction => {
        const messages = transaction.messages || [];
        const lastMessage = messages[messages.length - 1];
        const otherPartyEmail = user.id === transaction.buyer[0].id
          ? transaction.seller[0].email
          : transaction.buyer[0].email;

        const unreadCount = messages.filter(
          msg => msg.recipient_id === user.id && !msg.read_at
        ).length;

        return {
          transactionId: transaction.id,
          productTitle: transaction.products[0].title,
          otherPartyEmail,
          lastMessage: lastMessage?.content || null,
          lastMessageTime: lastMessage?.created_at || transaction.created_at,
          unreadCount,
          status: transaction.status
        };
      });

      setChats(chatPreviews);
    }

    fetchChats();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('messages_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages' 
      }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [router]);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="space-y-4">
        {chats.map((chat) => (
          <Link href={`/chat/${chat.transactionId}`} key={chat.transactionId}>
            <Card className="p-4 hover:bg-accent transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{chat.productTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                    {chat.otherPartyEmail}
                  </p>
                  <p className="text-sm mt-1">
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    chat.status === 'completed' ? 'bg-green-100 text-green-800' :
                    chat.status === 'in_escrow' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {chat.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(chat.lastMessageTime), 'MMM d, HH:mm')}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="inline-block bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs mt-1">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
