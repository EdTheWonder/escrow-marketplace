import { useState } from 'react';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Props {
  transactionId: string;
  onSuccess?: () => void;
}

export default function MarkAsDeliveredButton({ transactionId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMarkAsDelivered = async () => {
    try {
      setLoading(true);

      // Update transaction delivery status and stop countdown
      const { error } = await supabase
        .from('transactions')
        .update({ 
          delivery_status: 'delivered',
          delivered_at: new Date().toISOString(),
          delivery_deadline: null  // This stops the countdown
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast.success('Product marked as delivered. Waiting for buyer confirmation.');
      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as delivered');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleMarkAsDelivered}
      disabled={loading}
      className="w-full"
    >
      {loading ? 'Processing...' : 'Mark as Delivered'}
    </Button>
  );
} 