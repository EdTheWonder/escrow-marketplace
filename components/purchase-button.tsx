"use client";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PaystackPayment from "@/components/paystack-payment";
import { Checkbox } from "@radix-ui/react-checkbox";
import { TransactionTimer } from "@/lib/transaction-timer";
import EscrowChannel from "@/components/escrow-channel";
import PaymentStatus from "@/components/payment-status";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface Product {
  id: string;
  title: string;
  price: number;
  seller_id: string;
  payment_window: number;
}

export default function PurchaseButton({ product }: { product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [escrowId, setEscrowId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [showPaymentStatus, setShowPaymentStatus] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');

  async function handlePurchaseInit() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setShowTerms(true);
  }

  async function handleTermsAccepted() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create transaction in pending state
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          seller_id: product.seller_id,
          amount: product.price,
          status: 'pending'
        })
        .select()
        .single();

      if (transactionError) throw transactionError;
      setTransactionId(transaction.id);
      
      // Create escrow wallet
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

      setShowTerms(false);
      setShowChat(true);
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
      await Promise.all([
        supabase
          .from('escrow_wallets')
          .update({ status: 'holding' })
          .eq('id', escrowId),
        supabase
          .from('transactions')
          .update({ 
            payment_reference: reference,
            status: 'processing'
          })
          .eq('id', transactionId)
      ]);

      setShowPayment(false);
      setShowPaymentStatus(true);
      setPaymentReference(reference);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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

      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chat with Seller</DialogTitle>
          </DialogHeader>
          <div className="min-h-[400px]">
            <EscrowChannel transactionId={transactionId!} />
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => {
              setShowChat(false);
              setShowPayment(true);
            }}>
              Proceed to Payment
            </Button>
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

      <Dialog open={showPaymentStatus} onOpenChange={setShowPaymentStatus}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Status</DialogTitle>
          </DialogHeader>
          <PaymentStatus 
            reference={paymentReference}
            transactionId={transactionId!}
            productId={product.id}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
