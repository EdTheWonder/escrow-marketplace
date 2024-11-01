"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PAYSTACK_PUBLIC_KEY } from '@/lib/paystack';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount');
  const email = searchParams.get('email');
  const transactionId = searchParams.get('transactionId');
  const productId = searchParams.get('productId');
  const [scriptLoaded, setScriptLoaded] = useState(false);

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
    if (scriptLoaded && amount && email) {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: Math.round(Number(amount) * 100),
        currency: 'NGN',
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        onClose: () => {
          window.opener.postMessage({
            type: 'PAYSTACK_PAYMENT_COMPLETE',
            status: 'failed'
          }, '*');
          window.close();
        },
        onSuccess: (response: { reference: string }) => {
          window.opener.postMessage({
            type: 'PAYSTACK_PAYMENT_COMPLETE',
            status: 'success',
            reference: response.reference
          }, '*');
          window.close();
        },
      });

      handler.openIframe();
    }
  }, [scriptLoaded, amount, email]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">Initializing payment...</p>
    </div>
  );
} 