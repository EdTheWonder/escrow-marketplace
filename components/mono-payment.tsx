"use client";

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Script from 'next/script';

interface MonoPaymentProps {
  amount: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export default function MonoPayment({ amount, onSuccess, onClose }: MonoPaymentProps) {
  useEffect(() => {
    // @ts-ignore
    const monoInstance = new window.MonoPay({
      key: process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY,
      onClose: () => onClose(),
      onSuccess: (response: any) => {
        onSuccess(response.reference);
      },
    });

    return () => {
      monoInstance.close();
    };
  }, [onClose, onSuccess]);

  function handlePayment(event: React.MouseEvent<HTMLButtonElement>): void {
    // @ts-ignore
    const monoInstance = new window.MonoPay({
      key: process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY,
      onClose: () => onClose(),
      onSuccess: (response: any) => {
        onSuccess(response.reference);
      },
    });
    monoInstance.open();
  }

  return (
    <>
      <Script 
        src="https://js.mono.co/v1/mono.min.js"
        strategy="beforeInteractive"
      />
      <div className="p-4">
        <p className="text-lg font-semibold mb-4">
          Amount to Pay: ${amount}
        </p>
        <Button onClick={handlePayment} className="w-full">
          Pay with Mono
        </Button>
      </div>
    </>
  );
}
