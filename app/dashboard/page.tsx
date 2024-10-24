"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, ShoppingBag, Wallet, LogOut, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import ProductGrid from "@/components/product-grid";
import NavMenu from "@/components/nav-menu";
import GradientBackground from "@/components/ui/gradient-background";
import { getAvailableProducts } from "@/lib/products";

interface UserProfile {
  id: string;
  email: string;
  role: 'buyer' | 'seller';
  wallet_balance: number;
}

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    // Fetch user data and buyer data
    getBuyerData();
  }, []);

  async function getBuyerData() {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error) {
      console.error('Error fetching user:', error);
      return;
    }

    if (user) {
      const userProfile = user.user_metadata as UserProfile;
      setUser(userProfile);

      // Get buyer's purchases and feed products
      const [purchasesResponse, products] = await Promise.all([
        supabaseClient
          .from('products')
          .select('*, transactions!inner(*)')
          .eq('transactions.buyer_id', user.id),
        getAvailableProducts()
      ]);

      if (purchasesResponse.data) setPurchases(purchasesResponse.data);
      if (products) setProducts(products);

      // Get cart count
      const { data: cartData, error: cartError } = await supabaseClient
        .from('cart')
        .select('*')
        .eq('user_id', user.id);
      
      if (cartError) {
        console.error('Error fetching cart data:', cartError);
      } else {
        setCartCount(cartData?.length || 0);
      }
    }
  }

  async function handleSignOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      toast.error("Error signing out");
    } else {
      toast.success("Logged out successfully");
      router.push("/");
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <GradientBackground>
        <header className="bg-white/80 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              {user.role === 'buyer' ? 'Marketplace' : 'Your Products'}
            </h1>
            <div className="flex items-center gap-4">
              {user.role === 'buyer' && (
                <Link href="/cart" className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
              <NavMenu role={user.role} />
            </div>
          </div>
        </header>

        <main className="container mx-auto py-8 px-4">
          {user.role === 'buyer' ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Purchases</h2>
              <ProductGrid products={purchases} />
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Products</h2>
              <ProductGrid products={products} />
            </div>
          )}
        </main>
      </GradientBackground>
    </div>
  );
}
