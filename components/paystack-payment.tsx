"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import { PAYSTACK_PUBLIC_KEY } from '@/lib/paystack';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface PaystackPaymentProps {
  amount: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
  transactionId: string;
  productId: string;
}

export default function PaystackPayment({ amount, onSuccess, onClose, transactionId, productId }: PaystackPaymentProps) {
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    try {
      setLoading(true);
      
      // Create payment reference
      const reference = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update transaction with payment reference
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ payment_reference: reference })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      // Open Paystack popup
      const paymentWindow = window.open(
        `/api/payments/initiate?reference=${reference}&amount=${amount * 100}`,
        'PaystackPayment',
        'width=500,height=600'
      );

      if (!paymentWindow) {
        throw new Error("Popup blocked. Please allow popups and try again.");
      }

      // Listen for payment completion
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'PAYSTACK_PAYMENT_COMPLETE') {
          if (event.data.status === 'success') {
            onSuccess(reference);
          } else {
            toast.error("Payment failed");
            onClose();
          }
        }
      });

    } catch (error: any) {
      toast.error(error.message);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      onClick={handlePayment} 
      className="w-full"
      disabled={loading}
    >
      {loading ? "Processing..." : "Pay with Paystack"}
    </Button>
  );
}

