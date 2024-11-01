"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { PAYSTACK_PUBLIC_KEY } from '@/lib/paystack';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount');
  const email = searchParams.get('email');
  const transactionId = searchParams.get('transactionId');
  const productId = searchParams.get('productId');

  useEffect(() => {
    const initializePayment = () => {
      const handler = (window as any).PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: Number(amount) * 100,
        currency: 'NGN',
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
    };

    if ((window as any).PaystackPop) {
      initializePayment();
    }
  }, [amount, email]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Script 
        src="https://js.paystack.co/v1/inline.js"
        onLoad={() => {
          const initializePayment = (window as any).initializePayment;
          if (initializePayment) initializePayment();
        }}
      />
      <p>Initializing payment...</p>
    </div>
  );
} 