import { useEffect, useState } from 'react';
import { format, differenceInSeconds } from 'date-fns';

interface CountdownProps {
  deadline: string;
  onExpire?: () => void;
}

export default function TransactionCountdown({ deadline, onExpire }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = differenceInSeconds(deadlineDate, now);

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft('Expired');
        onExpire?.();
        return;
      }

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  return (
    <div className="text-sm font-medium">
      Time remaining: {timeLeft}
    </div>
  );
}
