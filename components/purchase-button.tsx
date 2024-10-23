"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MonoPayment from "@/components/mono-payment";

interface Product {
  id: string;
  title: string;
  price: number;
  seller_id: string;
}

export default function PurchaseButton({ product }: { product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  async function handlePurchaseInit() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Check if user is a buyer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'buyer') {
      toast.error("Only buyers can make purchases");
      return;
    }

    setShowPayment(true);
  }

  async function handlePaymentSuccess(reference: string) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          seller_id: product.seller_id,
          amount: product.price,
          status: 'pending',
          payment_reference: reference
        });

      if (transactionError) throw transactionError;

      toast.success("Purchase successful! Check your dashboard for status.");
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
        className="w-full"
      >
        {loading ? "Processing..." : "Buy Now"}
      </Button>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
          </DialogHeader>
          <MonoPayment
            amount={product.price}
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPayment(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
