import { useEffect, useState } from 'react';
import { format, differenceInSeconds } from 'date-fns';
import { DisputeService } from '@/lib/dispute';
import { EscrowService } from '@/lib/escrow';
import { toast } from 'sonner';

interface CountdownProps {
  deadline: string;
  transactionId: string;
  isSeller: boolean;
  onExpire?: () => void;
}

export default function TransactionCountdown({ 
  deadline, 
  transactionId,
  isSeller,
  onExpire 
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(async () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = differenceInSeconds(deadlineDate, now);

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft('Expired');
        
        // If seller, show dispute button
        if (isSeller) {
          toast.info("Time expired. You can now open a dispute if the buyer hasn't confirmed delivery.");
        } else {
          // If buyer hasn't confirmed, process refund
          await EscrowService.processRefund(transactionId);
          toast.info("Time expired. Processing refund...");
        }
        
        onExpire?.();
        return;
      }

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, transactionId, isSeller, onExpire]);

  return (
    <div className="text-sm font-medium text-red-500">
      Time remaining: {timeLeft}
    </div>
  );
}
