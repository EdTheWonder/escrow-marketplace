// app/sell/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import BankAccountForm from "@/components/bank-account-form";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SellPage() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [hasBankAccount, setHasBankAccount] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    checkBankAccount();
  }, []);

  useEffect(() => {
    if (basePrice > 0) {
      const fee = basePrice * 0.05; // 5% platform fee
      setPlatformFee(fee);
      setTotalPrice(basePrice + fee);
    } else {
      setPlatformFee(0);
      setTotalPrice(0);
    }
  }, [basePrice]);

  async function checkBankAccount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: bankAccount } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setHasBankAccount(!!bankAccount);
  }

  if (!hasBankAccount) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <h1 className="text-2xl font-semibold mb-8">Add Bank Account</h1>
        <p className="mb-4">You need to add your bank account before listing products.</p>
        <BankAccountForm onComplete={setHasBankAccount} />
      </div>
    );
  }

  const handlePriceChange = (value: number) => {
    setBasePrice(value);
  };

  const handleProductClick = async (product: any) => {
    if (product.status === 'in_escrow' || product.status === 'sold') {
      // Get transaction ID for this product
      const { data: transaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('product_id', product.id)
        .single();
        
      if (transaction) {
        router.push(`/chat/${transaction.id}`);
      }
    } else if (product.status === 'available') {
      router.push(`/products/${product.id}/edit`);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-8">Create Sell Offer</h1>
      
      <form className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Product Details</h2>
          <Input placeholder="Product Title" required />
          <textarea
            className="w-full p-2 border rounded-md"
            placeholder="Description"
            rows={4}
            required
          />
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Base Price</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={basePrice}
              onChange={(e) => handlePriceChange(Number(e.target.value))}
              required
            />
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Platform Fee (5%):</span>
                <span>₦{platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Listing Price:</span>
                <span>₦{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Input
            type="number"
            max={180}
            placeholder="Payment Time Limit (minutes, max 180)"
            required
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Payment Details</h2>
          <Input placeholder="Bank Name" required />
          <Input placeholder="Account Number" required />
          <Input placeholder="Account Name" required />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
          />
          <label htmlFor="terms" className="text-sm">
            I accept the terms and conditions
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={!acceptedTerms}>
          Create Offer
        </Button>
      </form>
    </div>
  );
}

