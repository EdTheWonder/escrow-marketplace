"use client";

import { useEffect } from 'react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NotificationHandler() {
  useEffect(() => {
    const setupNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${user.id}`
          },
          async (payload) => {
            const { data: sender } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', payload.new.sender_id)
              .single();

            toast.message('New Message', {
              description: `${sender?.email} sent you a message`,
              action: {
                label: 'View',
                onClick: () => window.location.href = `/chat/${payload.new.transaction_id}`
              }
            });
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    };

    setupNotifications();
  }, []);

  return null;
}
