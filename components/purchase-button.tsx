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
import DeliveryMethodSelector from "@/components/delivery/DeliveryMethodSelector";

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
  const [showDelivery, setShowDelivery] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [totalPrice, setTotalPrice] = useState(product.price);

  async function createTransactionAndEscrow() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Ensure delivery method is set
      if (!deliveryMethod) {
        throw new Error('Delivery method not selected');
      }

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          seller_id: product.seller_id,
          amount: totalPrice,
          status: 'pending',
          delivery_method: deliveryMethod,
          delivery_fee: deliveryMethod === 'sendbox' ? 1000 : 0 // Example fee
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create escrow wallet
      const { error: escrowError } = await supabase
        .from('escrow_wallets')
        .insert({
          transaction_id: transaction.id,
          amount: totalPrice,
          status: 'pending',
          seller_id: product.seller_id,
          buyer_id: user.id
        })
        .select()
        .single();

      if (escrowError) throw escrowError;

      setTransactionId(transaction.id);
      return transaction;
    } catch (error: any) {
      toast.error('Failed to create transaction');
      throw error;
    }
  }

  async function handlePurchaseInit() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setShowTerms(true);
  }

  async function handleTermsAccepted() {
    setShowTerms(false);
    setShowDelivery(true);
  }

  async function handleDeliverySelected(method: string, total: number) {
    setLoading(true);
    try {
      setDeliveryMethod(method);
      setTotalPrice(total);
      
      // Create transaction first
      const transaction = await createTransactionAndEscrow();
      
      if (transaction) {
        setShowDelivery(false);
        setShowPayment(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process delivery selection');
      // Keep the delivery dialog open if there's an error
      setDeliveryMethod('');
      setTotalPrice(product.price);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSuccess(reference: string) {
    if (!transactionId) return;
    
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
            status: 'in_escrow'
          })
          .eq('id', transactionId)
      ]);

      // Start escrow timer
      TransactionTimer.startEscrowTimer(transactionId);

      setShowPayment(false);
      setShowPaymentStatus(true);
      setPaymentReference(reference);

      // Redirect to transaction chat after a short delay
      setTimeout(() => {
        router.push(`/transactions/${transactionId}`);
      }, 2000);

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
            <Button 
              onClick={() => handleTermsAccepted()}
              variant="outline"
              className="w-full"
            >
              I Accept the Trade Terms
            </Button>
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
            amount={totalPrice}
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

      <Dialog open={showDelivery} onOpenChange={setShowDelivery}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Delivery Method</DialogTitle>
          </DialogHeader>
          <DeliveryMethodSelector 
            productPrice={product.price} 
            onSelect={handleDeliverySelected}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
