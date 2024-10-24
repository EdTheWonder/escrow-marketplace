"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import Script from 'next/script';
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface MonoPaymentProps {
  amount: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export default function MonoPayment({ amount, onSuccess, onClose }: MonoPaymentProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  
  async function handlePayment() {
    try {
      setLoading(true);
      
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login to continue");
        return;
      }

      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Payment initialization failed');

      const monoInstance = new (window as any).MonoPay({
        key: process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY,
        reference: data.reference,
        onClose: () => {
          setLoading(false);
          onClose();
        },
        onSuccess: (response: { reference: string }) => {
          onSuccess(data.reference);
        },
      });
      
      monoInstance.open();
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
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
          disabled={loading || !isScriptLoaded}
        >
          {loading ? "Initializing..." : "Pay with Mono"}
        </Button>
      </div>
    </>
  );
}
