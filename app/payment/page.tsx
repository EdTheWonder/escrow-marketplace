"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPaystack = async () => {
      try {
        // Add timeout to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        
        script.onload = () => {
          setScriptLoaded(true);
          setLoading(false);
          initializePayment();
        };

        script.onerror = () => {
          throw new Error('Failed to load Paystack script');
        };

        document.body.appendChild(script);
      } catch (error) {
        console.error('Paystack script error:', error);
        window.close();
      }
    };

    loadPaystack();

    return () => {
      const script = document.querySelector('script[src*="paystack"]');
      if (script) document.body.removeChild(script);
    };
  }, []);

  function initializePayment() {
    if (!window.PaystackPop || !searchParams.get('amount') || !searchParams.get('email')) {
      window.close();
      return;
    }
    
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: searchParams.get('email')!,
      amount: Math.round(Number(searchParams.get('amount')!) * 100),
      currency: 'NGN',
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      metadata: {
        transactionId: searchParams.get('transactionId'),
        productId: searchParams.get('productId')
      },
      onClose: function() {
        window.opener?.postMessage({
          type: 'PAYSTACK_PAYMENT_COMPLETE',
          status: 'failed'
        }, '*');
        window.close();
      },
      callback: function(response: { reference: string, status: string }) {
        if (response.status === 'success') {
          window.opener?.postMessage({
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

  return (
    <div className="min-h-screen flex items-center justify-center">
      {loading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4">Loading payment gateway...</p>
        </div>
      )}
    </div>
  );
} 