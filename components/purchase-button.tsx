"use client";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PaystackPayment from "@/components/paystack-payment";
import { Checkbox } from "@radix-ui/react-checkbox";
import { TransactionTimer } from "@/lib/transaction-timer";
import EscrowChannel from "@/components/escrow-channel";
import PaymentStatus from "@/components/payment-status";
import DeliveryMethodSelector from "@/components/delivery/DeliveryMethodSelector";
import { DeliveryMethod, updateTransactionToEscrow } from "@/lib/transactions";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface Product {
  status: string;
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
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    }
    getUser();
  }, []);

  // Don't show button if product is sold or user is the buyer
  if (product.status === 'sold' || product.status === 'in_escrow') {
    return null;
  }

  async function createTransactionAndEscrow() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          seller_id: product.seller_id,
          amount: totalPrice,
          status: 'pending',
          delivery_method: deliveryMethod as DeliveryMethod,
          delivery_fee: deliveryMethod === 'sendbox' ? 1000 : 0,
          delivery_status: 'pending'
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create escrow wallet
      const { data: escrow, error: escrowError } = await supabase
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
      setEscrowId(escrow.id);
      return transaction;
    } catch (error: any) {
      console.error('Transaction creation failed:', error);
      toast.error(error.message || 'Failed to create transaction');
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

  async function handleDeliverySelected(method: DeliveryMethod, total: number) {
    try {
      setDeliveryMethod(method);
      setTotalPrice(total);
      
      // Calculate delivery fee
      const deliveryFee = method === 'sendbox' ? 1000 : 0;
      
      // Create transaction with delivery details
      const transaction = await createTransactionAndEscrow();
      
      if (transaction) {
        setShowPayment(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process delivery selection');
    }
  }

  async function handlePaymentSuccess(reference: string) {
    if (!transactionId) return;
    
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
          .eq('id', transactionId),
        supabase
          .from('products')
          .update({ status: 'in_escrow' })
          .eq('id', product.id)
      ]);

      // After successful payment verification
      await updateTransactionToEscrow(transactionId);

      // Close delivery dialog after successful payment
      setShowDelivery(false);
      
      // Start escrow timer
      TransactionTimer.startEscrowTimer(transactionId);

      // Redirect to chat
      router.push(`/chat/${transactionId}`);
    } catch (error: any) {
      toast.error(error.message);
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

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
          </DialogHeader>
          <PaystackPayment
            amount={totalPrice}
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPayment(false)}
            transactionId={transactionId!}
            productId={product.id}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Escrow Chat</DialogTitle>
          </DialogHeader>
          <div className="min-h-[400px]">
            <EscrowChannel transactionId={transactionId!} />
          </div>
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
            onSuccess={() => handlePaymentSuccess(paymentReference)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
