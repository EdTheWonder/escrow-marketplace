"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PAYSTACK_PUBLIC_KEY } from '@/lib/paystack';

export default function PaymentPage() {
  const searchParams = useSearchParams();
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
          window.opener?.postMessage({
            type: 'PAYSTACK_PAYMENT_COMPLETE',
            status: 'failed'
          }, '*');
          window.close();
        },
        onSuccess: (response: { reference: string }) => {
          window.opener?.postMessage({
            type: 'PAYSTACK_PAYMENT_COMPLETE',
            status: 'success',
            reference: response.reference
          }, '*');
          window.close();
        },
      });
      
      handler.openIframe();
    }
  }, [scriptLoaded, searchParams]);

  return null;
} 