"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import Script from 'next/script';

interface MonoPaymentProps {
  amount: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export default function MonoPayment({ amount, onSuccess, onClose }: MonoPaymentProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  
  async function handlePayment() {
    try {
      const response = await fetch('/api/mono/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();
      if (!data.id) throw new Error('Failed to initialize payment');

      const monoInstance = new (window as any).MonoPay({
        key: process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY,
        reference: data.reference,
        onClose: () => onClose(),
        onSuccess: (response: { reference: string }) => {
          onSuccess(response.reference);
        },
      });
      
      monoInstance.open();
    } catch (error) {
      console.error('Payment initialization failed:', error);
    }
  }

  return (
    <>
      <Script 
        src="https://js.mono.co/v1/mono.min.js"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <div className="p-4">
        <p className="text-lg font-semibold mb-4">
          Amount to Pay: ${amount}
        </p>
        <Button 
          onClick={handlePayment} 
          className="w-full"
        >
          Pay with Mono
        </Button>
      </div>
    </>
  );
}
