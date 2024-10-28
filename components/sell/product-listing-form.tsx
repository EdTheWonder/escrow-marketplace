// components/sell/product-listing-form.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BankAccountForm from './bank-account-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProductListingForm() {
  const router = useRouter();
  const [bankId, setBankId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bankId) {
      toast.error('Please add bank account details first');
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const productData = {
        title: formData.get('title'),
        description: formData.get('description'),
        min_price: parseFloat(formData.get('min_price') as string),
        max_price: parseFloat(formData.get('max_price') as string),
        payment_window: Math.min(180, parseInt(formData.get('payment_window') as string)),
        bank_account_id: bankId,
        seller_id: user.id,
        status: 'available'
      };

      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) throw error;

      toast.success('Product listed successfully');
      router.push('/dashboard/listings');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {!bankId && (
        <BankAccountForm onComplete={setBankId} />
      )}

      {bankId && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Product Details</h2>
            <Input name="title" placeholder="Product Title" required />
            <textarea
              name="description"
              className="w-full p-2 border rounded-md"
              placeholder="Description"
              rows={4}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                name="min_price" 
                type="number" 
                placeholder="Minimum Price" 
                required 
              />
              <Input 
                name="max_price" 
                type="number" 
                placeholder="Maximum Price" 
                required 
              />
            </div>
            <Input
              name="payment_window"
              type="number"
              max={180}
              placeholder="Payment Time Limit (minutes, max 180)"
              required
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Listing'}
          </Button>
        </form>
      )}
    </div>
  );
}

