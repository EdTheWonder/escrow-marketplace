"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
import MonoPayment from "@/components/mono-payment";

interface CartItem {
  id: string;
  quantity: number;
  products: {
    id: string;
    title: string;
    price: number;
    image_urls: string[];
    seller_id: string;
  };
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCartItems();
  }, []);

  async function getCartItems() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('cart')
        .select(`
          *,
          products (
            id,
            title,
            price,
            image_urls,
            seller_id
          )
        `)
        .eq('user_id', user.id);
      
      if (data) setItems(data);
    }
  }

  async function updateQuantity(itemId: string, change: number) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return;

    const { error } = await supabase
      .from('cart')
      .update({ quantity: newQuantity })
      .eq('id', itemId);

    if (!error) {
      getCartItems();
    }
  }

  async function removeItem(itemId: string) {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', itemId);

    if (!error) {
      getCartItems();
      toast.success("Item removed from cart");
    }
  }

  const total = items.reduce((sum, item) => {
    return sum + (item.products.price * item.quantity);
  }, 0);

  async function handlePaymentSuccess(reference: string) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create transactions for each item
      for (const item of items) {
        await supabase.from('transactions').insert({
          product_id: item.products.id,
          buyer_id: user.id,
          seller_id: item.products.seller_id,
          amount: item.products.price * item.quantity,
          status: 'in_escrow',
          payment_reference: reference
        });

        // Update product status
        await supabase
          .from('products')
          .update({ status: 'pending' })
          .eq('id', item.products.id);
      }

      // Clear cart
      await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);

      toast.success("Purchase successful!");
      getCartItems();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
        
        {items.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Your cart is empty</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  <img
                    src={item.products.image_urls[0]}
                    alt={item.products.title}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.products.title}</h3>
                    <p className="text-muted-foreground">
                      ${item.products.price} x {item.quantity}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span>{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      ${(item.products.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold">${total.toFixed(2)}</span>
              </div>
              <MonoPayment
                amount={total}
                onSuccess={handlePaymentSuccess}
                onClose={() => {}}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
