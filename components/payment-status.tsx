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
    try {
      console.log('Starting payment verification with:', { reference, transactionId, productId });
      
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, transactionId, productId })
      });

      const data = await response.json();
      console.log('Verification response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment verification failed');
      }
      
      if (data.status === 'success') {
        setStatus('success');
        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      } else {
        throw new Error(data.error || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      toast.error(error.message);
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

  async function handlePaymentSuccess(reference: string) {
    if (!transactionId) return;
    
    try {
      console.log('Starting payment verification process...');
      
      // First verify with Paystack
      const verifyResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference })
      });

      const verifyData = await verifyResponse.json();
      console.log('Paystack verification response:', verifyData);

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Payment verification with Paystack failed');
      }

      // Then update statuses
      console.log('Updating transaction and product status...');
      const updateResponse = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reference,
          transactionId,
          productId 
        })
      });

      const updateData = await updateResponse.json();
      console.log('Status update response:', updateData);

      if (!updateResponse.ok) {
        throw new Error(updateData.error || 'Failed to update transaction status');
      }

      router.push(`/dashboard/transactions/${transactionId}`);
      onSuccess?.();
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast.error(error.message);
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
