"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Props {
  transactionId: string;
  onSuccess?: () => void;
}

export default function ConfirmDeliveryButton({ transactionId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/delivery/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId })
      });

      if (!response.ok) throw new Error('Failed to confirm delivery');

      toast({
        title: "Delivery Confirmed",
        description: "Payment has been released to the seller."
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm delivery. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleConfirm} 
      disabled={loading}
      className="w-full"
    >
      {loading ? "Confirming..." : "Confirm Delivery"}
    </Button>
  );
}
