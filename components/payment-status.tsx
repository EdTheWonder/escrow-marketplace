import { useEffect, useState, useCallback } from 'react';
import { Card } from './ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface PaymentStatusProps {
  reference: string;
  transactionId: string;
  productId: string;
  onSuccess?: () => void;
}

export default function PaymentStatus({ 
  reference, 
  transactionId, 
  productId,
  onSuccess 
}: PaymentStatusProps) {
  const [status, setStatus] = useState<'success' | 'failed' | 'processing'>('processing');
  const router = useRouter();

  const verifyPayment = useCallback(async () => {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, transactionId, productId })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        await Promise.all([
          supabase
            .from('products')
            .update({ status: 'in_escrow' })
            .eq('id', productId),
          supabase
            .from('transactions')
            .update({ 
              delivery_deadline: new Date(Date.now() + (12 * 60 * 60 * 1000)).toISOString(),
              status: 'in_escrow' 
            })
            .eq('id', transactionId)
        ]);
        setStatus('success');
        
        // Call success callback instead of handling redirect
        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      } else {
        setStatus('failed');
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 2000);
      }
    } catch (error) {
      setStatus('failed');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    }
  }, [reference, transactionId, productId, onSuccess, router]);

  useEffect(() => {
    if (reference) {
      verifyPayment();
    }
  }, [reference, verifyPayment]);

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
