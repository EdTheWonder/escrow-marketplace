"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  recipientId: string;
  recipientRole: 'buyer' | 'seller';
}

export default function FeedbackDialog({ 
  isOpen, 
  onClose, 
  transactionId, 
  recipientId,
  recipientRole 
}: Props) {
  const [type, setType] = useState<'positive' | 'neutral' | 'negative' | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!type) {
      toast.error('Please select a feedback type');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please login to leave feedback');
        return;
      }

      // Submit feedback
      const { error: feedbackError } = await supabase
        .from('feedback')
        .insert({
          transaction_id: transactionId,
          recipient_id: recipientId,
          reviewer_id: user.id,
          type,
          comment: comment.trim(),
        });

      if (feedbackError) throw feedbackError;

      // Update transaction status to completed
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      toast.success(`Feedback submitted for ${recipientRole}`);
      router.refresh();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Experience with the {recipientRole}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center gap-4">
            <Button
              variant={type === 'positive' ? 'default' : 'outline'}
              onClick={() => setType('positive')}
              className="flex gap-2"
            >
              <ThumbsUp className="w-4 h-4 text-green-500" />
              Positive
            </Button>
            
            <Button
              variant={type === 'neutral' ? 'default' : 'outline'}
              onClick={() => setType('neutral')}
              className="flex gap-2"
            >
              <Minus className="w-4 h-4 text-gray-500" />
              Neutral
            </Button>
            
            <Button
              variant={type === 'negative' ? 'default' : 'outline'}
              onClick={() => setType('negative')}
              className="flex gap-2"
            >
              <ThumbsDown className="w-4 h-4 text-red-500" />
              Negative
            </Button>
          </div>

          <Textarea
            placeholder="Leave a comment about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />

          <Button 
            onClick={handleSubmit} 
            disabled={loading || !type} 
            className="w-full"
          >
            {loading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 