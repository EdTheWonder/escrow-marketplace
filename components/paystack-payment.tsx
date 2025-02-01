"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import { PAYSTACK_PUBLIC_KEY } from '@/lib/paystack';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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

      // Create event listener before opening window
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'PAYSTACK_PAYMENT_COMPLETE') {
          window.removeEventListener('message', handleMessage);
          
          if (event.data.status === 'success') {
            try {
              await onSuccess(event.data.reference);
              onClose();
              router.push(`/dashboard/transactions/${transactionId}?from=payment`);
            } catch (error) {
              console.error('Payment success handler error:', error);
              toast.error("Error processing payment success");
            }
          } else {
            toast.error("Payment failed. Please try again.");
            onClose();
          } 
        }
      };

      window.addEventListener('message', handleMessage);

      // Open payment in new window
      const paymentWindow = window.open(
        `/payment?amount=${amount}&email=${user.email}&transactionId=${transactionId}&productId=${productId}`,
        'PaystackPayment',
        'width=500,height=600'
      );

      if (!paymentWindow) {
        toast.error("Popup blocked. Please allow popups and try again.");
      }

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
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
  );
}

