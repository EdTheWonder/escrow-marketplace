"use client";

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { initializePayment } from '@/lib/mono';
import { toast } from "sonner";

interface MonoPaymentProps {
  amount: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export default function MonoPayment({ amount, onSuccess, onClose }: MonoPaymentProps) {
  useEffect(() => {
    // Load Mono Connect script
    const script = document.createElement('script');
    script.src = "https://connect.mono.co/connect.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function handlePayment() {
    try {
      // Initialize payment
      const paymentData = await initializePayment(amount);
      
      // Launch Mono Connect
      const MonoConnect = (window as any).Connect;
      const monoInstance = new MonoConnect({
        key: process.env.NEXT_PUBLIC_MONO_TEST_PUBLIC_KEY,
        reference: paymentData.reference,
        onClose: () => {
          onClose();
        },
        onSuccess: (response: any) => {
          onSuccess(paymentData.reference);
        },
      });

      monoInstance.open();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <div className="p-4">
      <p className="text-lg font-semibold mb-4">
        Amount to Pay: ${amount}
      </p>
      <Button onClick={handlePayment} className="w-full">
        Pay Now
      </Button>
    </div>
  );
}
