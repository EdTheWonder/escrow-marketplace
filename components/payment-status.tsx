import { useEffect, useState, useCallback } from 'react';
import { Card } from './ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

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
    console.log('Starting payment verification process:', { 
      reference, 
      transactionId, 
      productId 
    });
    
    try {
      const verifyResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, transactionId, productId })
      });

      console.log('Verify payment response status:', verifyResponse.status);
      const verifyData = await verifyResponse.json();
      console.log('Verify payment response data:', verifyData);

      if (!verifyResponse.ok) {
        console.error('Payment verification failed:', verifyData);
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      console.log('Payment verified successfully, updating status...');
      setStatus('success');
      
      console.log('Redirecting to transaction page...');
      setTimeout(() => {
        router.push(`/dashboard/transactions/${transactionId}?from=payment`);
        onSuccess?.();
      }, 2000);

    } catch (error: any) {
      console.error('Payment verification process failed:', {
        error: error.message,
        stack: error.stack
      });
      setStatus('failed');
      toast.error(error.message);
      setTimeout(() => {
        router.push('/dashboard');
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
