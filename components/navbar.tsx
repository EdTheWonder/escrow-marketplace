import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { useSupabase } from '@/lib/supabase';

function ChatNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { supabase } = useSupabase();

  useEffect(() => {
    let channel: any;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fetchUnreadMessages = async () => {
        const { data } = await supabase
          .from('messages')
          .select('id')
          .eq('recipient_id', user.id)
          .eq('read', false);

        setUnreadCount(data?.length || 0);
      };

      fetchUnreadMessages();
      
      channel = supabase
        .channel('messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        }, () => {
          fetchUnreadMessages();
        })
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <Link href="/chats" className="relative">
      <MessageSquare className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </Link>
  );
}
