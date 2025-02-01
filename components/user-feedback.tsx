"use client";

import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { FeedbackItem } from './feedback-item';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function FeedbackStat({ type, count }: { type: 'positive' | 'neutral' | 'negative'; count: number }) {
  const Icon = type === 'positive' ? ThumbsUp : type === 'negative' ? ThumbsDown : Minus;
  return (
    <Card className="p-3 flex items-center gap-2">
      <Icon className="w-4 h-4" />
      <span>{count}</span>
    </Card>
  );
}

export default function UserFeedback({ userId, transactionId }: { userId: string, transactionId?: string }) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'positive' | 'neutral' | 'negative'>('positive');
  const [comment, setComment] = useState('');
  const [feedback, setFeedback] = useState<any[]>([]);
  const [stats, setStats] = useState({
    positive: 0,
    neutral: 0,
    negative: 0
  });

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('feedback')
        .insert({
          recipient_id: userId,
          reviewer_id: user.id,
          transaction_id: transactionId,
          type: feedbackType,
          comment: comment,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      if (transactionId) {
        await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('id', transactionId);
      }

      toast.success('Feedback submitted successfully');
      setShowFeedbackForm(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    async function fetchFeedback() {
      const { data } = await supabase
        .from('feedback')
        .select('*, reviewer:reviewer_id(*)')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (data) {
        setFeedback(data);
        setStats({
          positive: data.filter(f => f.type === 'positive').length,
          neutral: data.filter(f => f.type === 'neutral').length,
          negative: data.filter(f => f.type === 'negative').length
        });
      }
    }

    fetchFeedback();
  }, [userId]);

  return (
    <div className="space-y-4">
      {!showFeedbackForm ? (
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setFeedbackType('positive');
              setShowFeedbackForm(true);
            }}
          >
            <ThumbsUp className="w-5 h-5 text-green-500" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setFeedbackType('neutral');
              setShowFeedbackForm(true);
            }}
          >
            <Minus className="w-5 h-5 text-yellow-500" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setFeedbackType('negative');
              setShowFeedbackForm(true);
            }}
          >
            <ThumbsDown className="w-5 h-5 text-red-500" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Your Comment</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Submit Feedback</Button>
            <Button type="button" variant="outline" onClick={() => setShowFeedbackForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      <div className="flex gap-4 justify-center">
        <FeedbackStat type="positive" count={stats.positive} />
        <FeedbackStat type="neutral" count={stats.neutral} />
        <FeedbackStat type="negative" count={stats.negative} />
      </div>
      <div className="space-y-2">
        {feedback.map(f => (
          <FeedbackItem key={f.id} feedback={f} />
        ))}
      </div>
    </div>
  );
}
