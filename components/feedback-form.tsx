import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

interface FeedbackFormProps {
  onSubmit: (type: 'positive' | 'neutral' | 'negative', comment: string) => void;
}

export default function FeedbackForm({ onSubmit }: FeedbackFormProps) {
  const [type, setType] = useState<'positive' | 'neutral' | 'negative' | null>(null);
  const [comment, setComment] = useState('');

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Leave Feedback</h3>
      <div className="flex gap-4 mb-4">
        <Button
          variant={type === 'positive' ? 'default' : 'outline'}
          onClick={() => setType('positive')}
          className="bg-green-500 hover:bg-green-600"
        >
          <ThumbsUp className="w-4 h-4" />
        </Button>
        <Button
          variant={type === 'neutral' ? 'default' : 'outline'}
          onClick={() => setType('neutral')}
          className="bg-gray-500 hover:bg-gray-600"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Button
          variant={type === 'negative' ? 'default' : 'outline'}
          onClick={() => setType('negative')}
          className="bg-red-500 hover:bg-red-600"
        >
          <ThumbsDown className="w-4 h-4" />
        </Button>
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience..."
        className="mb-4"
      />
      <Button
        onClick={() => type && onSubmit(type, comment)}
        disabled={!type || comment.length < 3}
      >
        Submit Feedback
      </Button>
    </Card>
  );
}
