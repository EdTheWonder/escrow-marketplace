import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface PaymentStatusProps {
  reference: string;
  transactionId: string;
  productId: string;
}

export default function PaymentStatus({ reference, transactionId, productId }: PaymentStatusProps) {
  const [status, setStatus] = useState<'success' | 'failed' | 'processing'>('processing');
  const router = useRouter();

  useEffect(() => {
    verifyPayment();
  }, [reference]);

  async function verifyPayment() {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        await Promise.all([
          supabase
            .from('products')
            .update({ status: 'delivering' })
            .eq('id', productId),
          supabase
            .from('transactions')
            .update({ status: 'in_escrow' })
            .eq('id', transactionId)
        ]);
        setStatus('success');
      } else {
        setStatus('failed');
      }

      setTimeout(() => {
        router.push(data.status === 'success' 
          ? `/transactions/${transactionId}` 
          : '/dashboard'
        );
      }, 3000);
    } catch (error) {
      setStatus('failed');
    }
  }

  return (
    <div className="text-center p-6">
      {status === 'processing' && (
        <div className="space-y-4">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          <p>Verifying payment...</p>
        </div>
      )}
      {status === 'success' && (
        <div className="space-y-4 text-green-600">
          <CheckCircle className="w-12 h-12 mx-auto" />
          <div>
            <p className="font-semibold">Payment Successful!</p>
            <p className="text-sm text-muted-foreground">
              Redirecting to transaction details...
            </p>
          </div>
        </div>
      )}
      {status === 'failed' && (
        <div className="space-y-4 text-red-600">
          <XCircle className="w-12 h-12 mx-auto" />
          <div>
            <p className="font-semibold">Payment Failed</p>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
