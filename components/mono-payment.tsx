"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import Script from 'next/script';
import {
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MonoPaymentProps {
  amount: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export default function MonoPayment({ amount, onSuccess, onClose }: MonoPaymentProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  
  function handlePayment() {
    if (!isScriptLoaded || !(window as any).MonoPay) {
      console.error('Mono script not loaded');
      return;
    }

    const monoInstance = new (window as any).MonoPay({
      key: process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY,
      onClose: () => onClose(),
      onSuccess: (response: { reference: string }) => {
        onSuccess(response.reference);
      },
    });
    
    monoInstance.open();
  }

  return (
    <>
      <Script 
        src="https://js.mono.co/v1/mono.min.js"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <DialogHeader>
        <DialogTitle>Complete Payment</DialogTitle>
      </DialogHeader>
      <div className="p-4">
        <p className="text-lg font-semibold mb-4">
          Amount to Pay: ${amount}
        </p>
        <Button 
          onClick={handlePayment} 
          className="w-full" 
          disabled={!isScriptLoaded}
        >
          Pay with Mono
        </Button>
      </div>
    </>
  );
}
