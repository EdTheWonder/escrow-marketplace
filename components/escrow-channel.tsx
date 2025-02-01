import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Image, Video, Upload } from 'lucide-react';
import { uploadToR2 } from '@/lib/cloudflare-r2';
import { useRouter } from 'next/navigation';
import TransactionCountdown from './transaction-countdown';

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

interface EscrowChannelProps { 
  transactionId: string;
  allowMediaUpload?: boolean;
}

export default function EscrowChannel({ transactionId, allowMediaUpload = false }: EscrowChannelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const markMessageAsRead = useCallback(async (messageId: string) => {
    if (!currentUser?.id) return;
    
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('recipient_id', currentUser.id)
      .is('read_at', null);
  }, [currentUser]);

  const fetchMessages = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (!user) {
        console.log('No user found');
        return;
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('transaction_id', transactionId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      
      console.log('Messages fetch response:', { data, error });

      if (error) {
        console.error('Messages fetch error:', error);
        return;
      }
      
      if (data) {
        console.log('Setting messages:', data);
        setMessages(data);
        // Mark received messages as read
        data.forEach(msg => {
          if (msg.recipient_id === user.id && !msg.read_at) {
            markMessageAsRead(msg.id);
          }
        });
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    }
  }, [transactionId, markMessageAsRead]);

  const subscribeToMessages = useCallback(() => {
    const channel = supabase
      .channel(`messages:${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `transaction_id=eq.${transactionId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && payload.new.recipient_id === user.id) {
              markMessageAsRead(payload.new.id);
            }
            setMessages(current => [...current, payload.new as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [transactionId, markMessageAsRead]);

  useEffect(() => {
    getCurrentUser();
    fetchMessages();
    const unsubscribe = subscribeToMessages();
    
    const interval = setInterval(fetchMessages, 5000); // Refresh messages every 5 seconds
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchMessages, subscribeToMessages]);

  useEffect(() => {
    async function fetchTransaction() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      const { data: transaction } = await supabase
        .from('transactions')
        .select(`
          *,
          delivery_deadline,
          status,
          buyer:buyer_id (email),
          seller:seller_id (email)
        `)
        .eq('id', transactionId)
        .single();

      console.log('Transaction data:', transaction);
      
      if (transaction) {
        setTransaction(transaction);
        setIsSeller(transaction.seller_id === user.id);
      }
    }

    fetchTransaction();
  }, [transactionId]);

  const canOpenDispute = isSeller && 
    transaction?.status === 'in_escrow' && 
    transaction?.delivery_deadline && 
    new Date(transaction.delivery_deadline) < new Date();

  async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      toast.error('Authentication error');
      router.push('/auth/login');
      return;
    }
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
    if (!currentUser) {
      toast.error('Please login to send messages');
      return;
    }

    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('buyer_id, seller_id')
        .eq('id', transactionId)
        .single();

      if (!transaction) {
        toast.error('Transaction not found');
        return;
      }

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
      toast.error('Failed to send message: ' + error.message);
    }
  }

  async function handleCreateDispute(transactionId: string) {
    try {
      const response = await fetch('/api/transactions/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create dispute');
      }

      toast.success("Dispute created! Our team will review the transaction.");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Escrow Chat</h2>
        </div>
        
        {transaction?.status === 'in_escrow' && transaction.delivery_deadline && (
          <TransactionCountdown 
            deadline={transaction.delivery_deadline}
            transactionId={transaction.id}
            isSeller={isSeller}
            onExpire={() => {
              // Refresh messages and transaction data
              fetchMessages();
            }}
          />
        )}

        {canOpenDispute && (
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-red-700 text-sm">
              Delivery deadline has passed. You can now open a dispute.
            </p>
            <Button
              onClick={() => handleCreateDispute(transactionId)}
              variant="destructive"
              size="sm"
              className="mt-2"
            >
              Open Dispute
            </Button>
          </div>
        )}

        <div className="h-[400px] overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start the conversation with the other party</p>
            </div>
          ) : (
            messages.map((message) => (
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
            ))
          )}
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

