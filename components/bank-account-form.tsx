import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BankAccount {
  account_name: string;
  account_number: string;
  bank_name: string;
}

interface BankAccountFormProps {
  onComplete?: (value: boolean) => void;
}

export default function BankAccountForm({ onComplete }: BankAccountFormProps) {
  const [bankAccount, setBankAccount] = useState<BankAccount>({
    account_name: '',
    account_number: '',
    bank_name: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('bank_accounts')
        .upsert({
          user_id: user.id,
          ...bankAccount
        });

      if (error) throw error;
      
      toast.success('Bank account information saved successfully');
      onComplete?.(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Account Name</label>
        <Input
          value={bankAccount.account_name}
          onChange={(e) => setBankAccount(prev => ({
            ...prev,
            account_name: e.target.value
          }))}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Account Number</label>
        <Input
          value={bankAccount.account_number}
          onChange={(e) => setBankAccount(prev => ({
            ...prev,
            account_number: e.target.value
          }))}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Bank Name</label>
        <Input
          value={bankAccount.bank_name}
          onChange={(e) => setBankAccount(prev => ({
            ...prev,
            bank_name: e.target.value
          }))}
          required
        />
      </div>

      <Button type="submit">Save Bank Account</Button>
    </form>
  );
}
