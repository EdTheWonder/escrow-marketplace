// components/sell/bank-account-form.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BankAccountFormProps {
  onComplete: (bankId: string) => void;
}

export default function BankAccountForm({ onComplete }: BankAccountFormProps) {
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: bank, error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: user.id,
          bank_name: formData.get('bank_name'),
          account_number: formData.get('account_number'),
          account_name: formData.get('account_name')
        })
        .select()
        .single();

      if (error) throw error;

      onComplete(bank.id);
      toast.success('Bank account added successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Payment Details</h2>
        <Input name="bank_name" placeholder="Bank Name" required />
        <Input name="account_number" placeholder="Account Number" required />
        <Input name="account_name" placeholder="Account Name" required />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="terms" 
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
          />
          <label htmlFor="terms" className="text-sm">
            I accept the terms and conditions
          </label>
        </div>
        <Button type="submit" disabled={loading || !termsAccepted}>
          {loading ? 'Adding...' : 'Add Bank Account'}
        </Button>
      </div>
    </form>
  );
}

