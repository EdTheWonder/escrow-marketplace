import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { FeedbackItem } from './feedback-item';

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

export default function UserFeedback({ userId }: { userId: string }) {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [stats, setStats] = useState({
    positive: 0,
    neutral: 0,
    negative: 0
  });

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
