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
    script.onload = () => {
      setScriptLoaded(true);
      initializePayment();
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  function initializePayment() {
    if (!window.PaystackPop || !searchParams.get('amount') || !searchParams.get('email')) return;
    
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: searchParams.get('email')!,
      amount: Math.round(Number(searchParams.get('amount')!) * 100),
      currency: 'NGN',
      reference: searchParams.get('reference')!,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      metadata: {
        transactionId: searchParams.get('transactionId'),
        productId: searchParams.get('productId')
      },
      onClose: function() {
        window.opener.postMessage({
          type: 'PAYSTACK_PAYMENT_COMPLETE',
          status: 'failed'
        }, '*');
        window.close();
      },
      callback: function(response: { reference: string, status: string }) {
        if (response.status === 'success') {
          window.opener.postMessage({
            type: 'PAYSTACK_PAYMENT_COMPLETE',
            status: 'success',
            reference: response.reference
          }, '*');
          window.close();
        }
      }
    });
    
    handler.openIframe();
  }

  return null;
} 