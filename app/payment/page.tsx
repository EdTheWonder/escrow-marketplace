"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPaystack = async () => {
      try {
        // Remove existing Paystack script if any
        const existingScript = document.querySelector('script[src*="paystack"]');
        if (existingScript) {
          document.body.removeChild(existingScript);
        }

        // Create and load new script
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;

        // Wait for script to load
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });

        // Wait additional time for Paystack to initialize
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Initialize payment only if Paystack is loaded
        if (window.PaystackPop) {
          initializePayment();
        } else {
          throw new Error('Paystack failed to initialize');
        }
      } catch (error) {
        console.error('Paystack script error:', error);
        window.opener?.postMessage({
          type: 'PAYSTACK_PAYMENT_COMPLETE',
          status: 'failed'
        }, '*');
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

    try {
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
      
      setLoading(false);
      handler.openIframe();
    } catch (error) {
      console.error('Payment initialization error:', error);
      window.close();
    }
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