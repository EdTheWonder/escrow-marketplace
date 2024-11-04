"use client";

import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/lib/supabase";

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
                onClick: () => window.location.href = `/dashboard/transactions/${payload.new.transaction_id}`
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
