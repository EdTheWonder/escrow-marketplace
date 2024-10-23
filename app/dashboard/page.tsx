"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, ShoppingBag, Wallet, LogOut, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import ProductGrid from "@/components/product-grid";
import { Product } from "@/types/index";

interface UserProfile {
  id: string;
  email: string;
  role: 'buyer' | 'seller';
  wallet_balance: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [purchases, setPurchases] = useState<Product[]>([]);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user?.role === 'seller') {
      getSellerData();
    } else if (user?.role === 'buyer') {
      getBuyerData();
    }
  }, [user?.role]);

  async function getUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();
      
      setUser({ ...authUser, ...profile });
    }
  }

  async function getSellerData() {
    if (!user) return;

    // Get seller's products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    
    if (productsData) setProducts(productsData);

    // Calculate earnings from completed transactions
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('seller_id', user.id)
      .eq('status', 'completed');

    if (transactionsData) {
      const total = transactionsData.reduce((sum, t) => sum + t.amount, 0);
      setEarnings(total);
    }
  }

  async function getBuyerData() {
    if (!user) return;

    // Get buyer's purchases and recommended products
    const [purchasesResponse, recommendedResponse] = await Promise.all([
      supabase
        .from('products')
        .select('*, transactions!inner(*)')
        .eq('transactions.buyer_id', user.id),
      supabase
        .from('products')
        .select('*')
        .eq('status', 'available')
        .limit(6)
    ]);

    if (purchasesResponse.data) setPurchases(purchasesResponse.data);
    if (recommendedResponse.data) setProducts(recommendedResponse.data);

    // Get cart count
    const { data: cartData } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', user.id);
    
    setCartCount(cartData?.length || 0);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    router.push("/");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              {user.role === 'buyer' ? 'Buyer' : 'Seller'} Dashboard
            </h1>
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
              {user.role}
            </span>
          </div>
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
            <Button onClick={handleSignOut} variant="ghost">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Shared Stats Section */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p className="text-2xl font-bold capitalize">{user.role}</p>
              </div>
              {user.role === 'buyer' ? (
                <ShoppingBag className="w-8 h-8 text-primary" />
              ) : (
                <Package className="w-8 h-8 text-primary" />
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-2xl font-bold">{user.email}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
                <p className="text-2xl font-bold">${user.wallet_balance}</p>
              </div>
              <Wallet className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Role-specific Content */}
        {user.role === 'buyer' ? (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Purchases</h2>
                <Link href="/dashboard/transactions" className="text-primary hover:underline">
                  View All Transactions
                </Link>
              </Card>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Shopping Cart</h2>
                <Link href="/cart" className="text-primary hover:underline">
                  View Cart ({cartCount} items)
                </Link>
              </Card>
            </div>
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Recommended Products</h2>
                <Button asChild>
                  <Link href="/products">Browse All Products</Link>
                </Button>
              </div>
              <ProductGrid products={products} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Products</h2>
              <Button asChild>
                <Link href="/dashboard/products/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Product
                </Link>
              </Button>
            </div>
            <ProductGrid products={products} />
          </div>
        )}
      </main>
    </div>
  );
}
