// components/wallet-management.tsx
"use client";

import { useState } from 'react';
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BankAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
}

export default function WalletManagement({ balance }: { balance: number }) {
  const [loading, setLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [showAddBank, setShowAddBank] = useState(false);

  async function handleAddBank(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const bankData = {
      bank_name: formData.get('bank_name'),
      account_number: formData.get('account_number'),
      account_name: formData.get('account_name')
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: user.id,
          ...bankData
        });

      if (error) throw error;

      setBankAccount(bankData as BankAccount);
      setShowAddBank(false);
      toast.success('Bank account added successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!bankAccount) {
      toast.error('Please add a bank account first');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: balance })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success('Withdrawal initiated successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Wallet Management</h2>
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Available Balance</p>
        <p className="text-3xl font-bold">₦{balance}</p>
      </div>

      {!bankAccount && !showAddBank ? (
        <Button onClick={() => setShowAddBank(true)}>Add Bank Account</Button>
      ) : bankAccount ? (
        <div className="space-y-4">
          <div className="text-sm">
            <p>Bank: {bankAccount.bank_name}</p>
            <p>Account: {bankAccount.account_number}</p>
            <p>Name: {bankAccount.account_name}</p>
          </div>
          <Button 
            onClick={handleWithdraw} 
            disabled={loading || balance <= 0}
          >
            {loading ? "Processing..." : "Withdraw to Bank Account"}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleAddBank} className="space-y-4">
          <Input
            name="bank_name"
            placeholder="Bank Name"
            required
          />
          <Input
            name="account_number"
            placeholder="Account Number"
            required
          />
          <Input
            name="account_name"
            placeholder="Account Name"
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Bank Account"}
          </Button>
        </form>
      )}
    </Card>
  );
}

