"use client";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EscrowService } from '@/lib/escrow';
import { TransactionTimer } from '@/lib/transaction-timer';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PaystackPayment from "@/components/paystack-payment";
import { Checkbox } from "@radix-ui/react-checkbox";

interface Product {
  id: string;
  title: string;
  price: number;
  seller_id: string;
  payment_window: number; // in minutes, max 180
}

export default function PurchaseButton({ product }: { product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [escrowId, setEscrowId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  async function handlePurchaseInit() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Show terms dialog first
    setShowTerms(true);
  }

  async function handleTermsAccepted() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create escrow first without payment
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_wallets')
        .insert({
          amount: product.price,
          status: 'awaiting_payment',
          seller_id: product.seller_id,
          buyer_id: user.id,
          product_id: product.id,
          payment_deadline: new Date(Date.now() + (product.payment_window * 60 * 1000)),
          delivery_deadline: new Date(Date.now() + (12 * 60 * 60 * 1000))
        })
        .select()
        .single();

      if (escrowError) throw escrowError;

      setEscrowId(escrow.id);
      setShowTerms(false);
      setShowPayment(true);

      // Start escrow timer
      TransactionTimer.startEscrowTimer(escrow.id);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSuccess(reference: string) {
    if (!escrowId) return;
    
    setLoading(true);
    try {
      // Update escrow status and create transaction
      await Promise.all([
        supabase
          .from('escrow_wallets')
          .update({ status: 'holding' })
          .eq('id', escrowId),
        supabase
          .from('transactions')
          .insert({
            escrow_id: escrowId,
            product_id: product.id,
            payment_reference: reference,
            status: 'in_escrow'
          })
      ]);

      // Start delivery timer
      TransactionTimer.startDeliveryTimer(escrowId);

      toast.success("Payment successful! Awaiting delivery confirmation.");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
      setShowPayment(false);
    }
  }

  return (
    <>
      <Button 
        onClick={handlePurchaseInit} 
        disabled={loading}
        size="sm"
      >
        {loading ? "Processing..." : "Buy"}
      </Button>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trade Terms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Payment window: {product.payment_window} minutes</p>
            <p>Delivery window: 12 hours</p>
            <Checkbox 
              id="terms" 
              onCheckedChange={(checked) => {
                if (checked) handleTermsAccepted();
              }}
            />
            <label htmlFor="terms">I accept the trade terms</label>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
          </DialogHeader>
          <PaystackPayment
            amount={product.price}
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPayment(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
