"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import FeedbackDialog from "../feedback/FeedbackDialog";

interface Props {
  transactionId: string;
  userId: string;
  onSuccess?: () => void;
}

export default function ConfirmDeliveryButton({ transactionId, userId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<{ id: string } | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleConfirm = async () => {
    try {
      setLoading(true);
      
      // Get seller info first
      const { data: transaction } = await supabase
        .from('transactions')
        .select('seller_id')
        .eq('id', transactionId)
        .single();

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      setSellerInfo({ id: transaction.seller_id });

      const response = await fetch('/api/delivery/confirm', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          transactionId,
          userId 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm delivery');
      }

      toast.success("Delivery confirmed! Please leave feedback for the seller.");
      onSuccess?.();
      setShowFeedback(true);
    } catch (error: any) {
      console.error('Delivery confirmation error:', error);
      toast.error(error.message || "Failed to confirm delivery. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleConfirm} 
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {loading ? "Confirming..." : "I have received and am satisfied with the product"}
      </Button>

      {showFeedback && sellerInfo && (
        <FeedbackDialog
          isOpen={showFeedback}
          onClose={() => {
            setShowFeedback(false);
            router.refresh();
          }}
          transactionId={transactionId}
          recipientId={sellerInfo.id}
          recipientRole="seller"
        />
      )}
    </>
  );
}
