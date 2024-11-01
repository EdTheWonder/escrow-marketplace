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
import { Product, UserProfile } from "@/types";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState<number>(0);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('feed');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Get user data
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError) throw userError;

      if (user) {
        const userProfile = user.user_metadata as UserProfile;
        setUser(userProfile);

        // Fetch available products
        const { data: products, error: productsError } = await supabaseClient
          .from('products')
          .select(`
            *,
            profiles:seller_id (
              email
            )
          `)
          .eq('seller_id', user.id)  // Only show products owned by the user
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        // Process the image URLs before setting the products
        const processedProducts = products?.map((product: Product) => ({
          ...product,
          image_urls: typeof product.image_urls === 'string' 
            ? JSON.parse(product.image_urls) 
            : product.image_urls
        }));

        setProducts(processedProducts || []);

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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex gap-4">
              <Button
                variant={activeTab === 'feed' ? 'default' : 'outline'}
                onClick={() => setActiveTab('feed')}
              >
                My Listings
              </Button>
              <Button asChild>
                <Link href="/dashboard/products/new">
                  <Plus className="mr-2 h-5 w-5" />
                  Sell Now
                </Link>
              </Button>
            </div>
          </div>

          {activeTab === 'feed' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/products/${product.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square">
                      {Array.isArray(product.image_urls) && product.image_urls[0] && (
                        <Image
                          src={product.image_urls[0]}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="font-semibold truncate">{product.title}</h2>
                      <p className="text-lg font-bold">${product.price}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </main>
      </GradientBackground>
    </div>
  );
}
