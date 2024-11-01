import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Image, Video, Upload } from 'lucide-react';
import { uploadToR2 } from '@/lib/cloudflare-r2';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  media_url?: string;
  media_type?: 'image' | 'video';
  recipient_id: string;
  read_at: string | null;
  deleted_at: string | null;
}

export default function EscrowChannel({ 
  transactionId, 
  allowMediaUpload = false 
}: { 
  transactionId: string;
  allowMediaUpload?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    if (!currentUser) return;
    
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('recipient_id', currentUser.id)
      .is('read_at', null);
  }, [currentUser]);

  const fetchMessages = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('transaction_id', transactionId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data);
      // Mark received messages as read
      data.forEach(msg => {
        if (msg.recipient_id === user.id && !msg.read_at) {
          markMessageAsRead(msg.id);
        }
      });
    }
  }, [transactionId, markMessageAsRead]);

  const subscribeToMessages = useCallback(() => {
    if (!currentUser) return () => {};

    const channel = supabase
      .channel(`messages:${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes
          schema: 'public',
          table: 'messages',
          filter: `transaction_id=eq.${transactionId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(current => [...current, payload.new as Message]);
            // Mark as read if we're the recipient
            if (payload.new.recipient_id === currentUser.id) {
              markMessageAsRead(payload.new.id);
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(current => 
              current.map(msg => 
                msg.id === payload.new.id ? payload.new as Message : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [transactionId, currentUser, markMessageAsRead]);

  useEffect(() => {
    fetchMessages();
    const unsubscribe = subscribeToMessages();
    
    return () => {
      unsubscribe();
    };
  }, [transactionId, fetchMessages, subscribeToMessages]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    
    const file = e.target.files[0];
    setUploading(true);

    try {
      const mediaUrl = await uploadToR2(file);
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';

      await sendMessage(e, mediaUrl, mediaType);
    } catch (error) {
      toast.error('Failed to upload media');
    } finally {
      setUploading(false);
    }
  }

  async function sendMessage(
    e: React.FormEvent, 
    mediaUrl?: string, 
    mediaType?: 'image' | 'video'
  ) {
    e.preventDefault();
    if (!newMessage.trim() && !mediaUrl) return;
    if (!currentUser) return;

    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('buyer_id, seller_id')
        .eq('id', transactionId)
        .single();

      if (!transaction) throw new Error('Transaction not found');

      const recipientId = currentUser.id === transaction.buyer_id 
        ? transaction.seller_id 
        : transaction.buyer_id;

      const { error } = await supabase
        .from('messages')
        .insert({
          transaction_id: transactionId,
          sender_id: currentUser.id,
          recipient_id: recipientId,
          content: newMessage.trim(),
          media_url: mediaUrl,
          media_type: mediaType
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      toast.error('Failed to send message');
    }
  }

  return (
    <Card className="p-4">
      <div className="h-[400px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender_id === currentUser?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.media_url && (
                  message.media_type === 'image' ? (
                    <img 
                      src={message.media_url} 
                      alt="Shared image"
                      className="max-w-full rounded-lg mb-2"
                    />
                  ) : (
                    <video 
                      src={message.media_url}
                      controls
                      className="max-w-full rounded-lg mb-2"
                    />
                  )
                )}
                <p>{message.content}</p>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>{format(new Date(message.created_at), 'HH:mm')}</span>
                  {message.sender_id === currentUser?.id && (
                    message.read_at ? (
                      <span className="text-blue-500">✓✓</span>
                    ) : (
                      <span>✓</span>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <form onSubmit={(e) => sendMessage(e)} className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            rows={1}
          />
          {allowMediaUpload && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={uploading}
              >
                <label className="cursor-pointer">
                  <Image className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                </label>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={uploading}
              >
                <label className="cursor-pointer">
                  <Video className="h-4 w-4" />
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                </label>
              </Button>
            </div>
          )}
          <Button type="submit" disabled={uploading}>Send</Button>
        </form>
      </div>
    </Card>
  );
}

