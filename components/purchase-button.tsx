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
  const [showPayment, setShowPayment] = useState(false);
  const [escrowId, setEscrowId] = useState<string | null>(null);

  async function handlePurchaseInit() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Check if seller has bank account
    const { data: sellerBank } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', product.seller_id)
      .single();

    if (!sellerBank) {
      toast.error("Seller hasn't set up payment details");
      return;
    }

    try {
      // Create escrow first
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_wallets')
        .insert({
          amount: product.price,
          status: 'pending',
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
      setShowPayment(true);

      // Start payment timer
      TransactionTimer.startPaymentTimer(escrow.id);
    } catch (error: any) {
      toast.error(error.message);
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
