"use client";

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MonoPaymentProps {
  amount: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export default function MonoPayment({ amount, onSuccess, onClose }: MonoPaymentProps) {
  useEffect(() => {
    // Initialize Mono Connect
    const script = document.createElement('script');
    script.src = "https://connect.mono.co/connect.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = () => {
    const MonoConnect = (window as any).MonoConnect;
    
    const monoInstance = new MonoConnect({
      key: process.env.NEXT_PUBLIC_MONO_TEST_PUBLIC_KEY,
      onClose: () => onClose(),
      onSuccess: ({ reference }: { reference: string }) => {
        onSuccess(reference);
      },
    });

    monoInstance.open();
  };

  return (
    <Button 
      onClick={handlePayment}
      className="w-full"
    >
      Pay ${amount}
    </Button>
  );
}

