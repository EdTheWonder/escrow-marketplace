import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import FeedbackForm from './feedback-form';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EscrowChannel({ transactionId }: { transactionId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [transaction, setTransaction] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    fetchTransaction();
    subscribeToMessages();
  }, [transactionId]);

  async function fetchTransaction() {
    const { data } = await supabase
      .from('transactions')
      .select(`
        *,
        products (*),
        buyers:buyer_id (*),
        sellers:seller_id (*)
      `)
      .eq('id', transactionId)
      .single();

    setTransaction(data);
    if (data?.status === 'completed' && !data?.feedback_submitted) {
      setShowFeedback(true);
    }
  }

  async function submitFeedback(type: 'positive' | 'neutral' | 'negative', comment: string) {
    if (comment.length < 3) {
      toast.error('Comment must be at least 3 characters long');
      return;
    }

    const { error } = await supabase.from('feedback').insert({
      transaction_id: transactionId,
      reviewer_id: transaction.buyer_id,
      recipient_id: transaction.seller_id,
      type,
      comment
    });

    if (error) {
      toast.error('Failed to submit feedback');
      return;
    }

    await supabase
      .from('transactions')
      .update({ feedback_submitted: true })
      .eq('id', transactionId);

    setShowFeedback(false);
    toast.success('Feedback submitted successfully');
  }

  return (
    <div className="space-y-4">
      {/* Transaction details */}
      {/* Message thread */}
      {showFeedback && (
        <FeedbackForm onSubmit={(type: 'positive' | 'neutral' | 'negative', comment: string) => submitFeedback(type, comment)} />
      )}
    </div>
  );
}

function subscribeToMessages() {
    throw new Error('Function not implemented.');
}

