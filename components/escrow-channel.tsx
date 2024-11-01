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

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  }, [transactionId]);

  const subscribeToMessages = useCallback(() => {
    const channel = supabase
      .channel(`messages:${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `transaction_id=eq.${transactionId}`
        },
        (payload) => {
          setMessages(current => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [transactionId]);

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

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          transaction_id: transactionId,
          sender_id: currentUser?.id,
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
                <span className="text-xs opacity-70">
                  {format(new Date(message.created_at), 'HH:mm')}
                </span>
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

