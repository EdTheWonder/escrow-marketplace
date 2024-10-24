"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import Script from 'next/script';
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import { PAYSTACK_PUBLIC_KEY } from '@/lib/paystack';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface PaystackPaymentProps {
  amount: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export default function PaystackPayment({ amount, onSuccess, onClose }: PaystackPaymentProps) {
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login to continue");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("User email not found");
        return;
      }

      const handler = (window as any).PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: amount * 100,
        currency: 'NGN',
        onClose: () => {
          setLoading(false);
          onClose();
        },
        onSuccess: (response: { reference: string }) => {
          onSuccess(response.reference);
        },
      });

      handler.openIframe();
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <>
      <Script 
        src="https://js.paystack.co/v1/inline.js"
        strategy="lazyOnload"
      />
      <div className="p-4">
        <p className="text-lg font-semibold mb-4">
          Amount to Pay: ₦{amount}
        </p>
        <Button 
          onClick={handlePayment} 
          className="w-full"
          disabled={loading}
        >
          {loading ? "Processing..." : "Pay with Paystack"}
        </Button>
      </div>
    </>
  );
}

