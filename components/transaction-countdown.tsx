import { useEffect, useState } from 'react';
import { format, differenceInSeconds } from 'date-fns';
import { DisputeService } from '@/lib/dispute';
import { EscrowService } from '@/lib/escrow';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

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
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(async () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = differenceInSeconds(deadlineDate, now);

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft('Expired');
        setIsExpired(true);
        
        if (isSeller) {
          toast.info("Time expired. You can now open a dispute if the buyer hasn't confirmed delivery.");
        } else {
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
    <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
      <AlertCircle className="w-5 h-5 text-yellow-600" />
      <div>
        <p className="text-sm font-medium text-yellow-800">
          {isExpired ? 'Delivery window expired' : 'Delivery window closing in:'}
        </p>
        <p className="text-lg font-bold text-yellow-900">
          {timeLeft}
        </p>
      </div>
    </div>
  );
}
