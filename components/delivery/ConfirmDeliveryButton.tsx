"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { confirmDelivery } from "@/lib/transactions";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Props {
  transactionId: string;
  onSuccess?: () => void;
}

export default function ConfirmDeliveryButton({ transactionId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleConfirm = async () => {
    try {
      console.log('Starting confirmation process for transaction:', transactionId);
      setLoading(true);

      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('Calling confirmDelivery...');
      const result = await confirmDelivery(transactionId);
      console.log('confirmDelivery result:', result);
      
      if (result.success) {
        console.log('Confirmation successful');
        setIsConfirmed(true);
        toast({
          title: "Delivery Confirmed",
          description: "Payment has been released to the seller."
        });

        onSuccess?.();
        router.refresh();
        router.push(`/dashboard/transactions/${transactionId}`);
      }
    } catch (error: any) {
      console.error('Confirmation error:', error);
      console.error('Error stack:', error.stack);
      toast({
        title: "Error",
        description: error.message || "Failed to confirm delivery. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isConfirmed) {
    return null;
  }

  return (
    <Button 
      onClick={handleConfirm} 
      disabled={loading}
      className="w-full bg-green-600 hover:bg-green-700"
    >
      {loading ? "Confirming delivery..." : "I have received and am satisfied with the product"}
    </Button>
  );
}
