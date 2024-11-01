"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PAYSTACK_PUBLIC_KEY } from '@/lib/paystack';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'initializing' | 'processing' | 'success' | 'failed'>('initializing');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (scriptLoaded && searchParams.get('amount') && searchParams.get('email')) {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: searchParams.get('email')!,
        amount: Math.round(Number(searchParams.get('amount')!) * 100),
        currency: 'NGN',
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        metadata: {
          transactionId: searchParams.get('transactionId'),
          productId: searchParams.get('productId')
        },
        onClose: () => {
          setPaymentStatus('failed');
          window.opener.postMessage({
            type: 'PAYSTACK_PAYMENT_COMPLETE',
            status: 'failed'
          }, '*');
          setTimeout(() => window.close(), 1000);
        },
        onSuccess: (response: { reference: string }) => {
          setPaymentStatus('success');
          window.opener.postMessage({
            type: 'PAYSTACK_PAYMENT_COMPLETE',
            status: 'success',
            reference: response.reference
          }, '*');
          setTimeout(() => window.close(), 1000);
        },
      });

      handler.openIframe();
    }
  }, [scriptLoaded, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {paymentStatus === 'initializing' && <p className="text-lg">Initializing payment...</p>}
      {paymentStatus === 'success' && <p className="text-lg text-green-600">Payment successful! Redirecting...</p>}
      {paymentStatus === 'failed' && <p className="text-lg text-red-600">Payment failed! Closing window...</p>}
    </div>
  );
} 