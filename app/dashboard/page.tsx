"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ShoppingCart, Package } from "lucide-react";
import Link from "next/link";
import ProductGrid from "@/components/product-grid";
import NavMenu from "@/components/nav-menu";
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

  useEffect(() => {
    const channel = supabase
      .channel('product_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          // Update local state when product status changes
          setProducts(currentProducts => 
            currentProducts.map(product => 
              'id' in product && 'id' in payload.new && product.id === payload.new.id
                ? { ...product, ...payload.new }
                : product
            )
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  async function fetchDashboardData() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (user) {
        const userProfile = user.user_metadata as UserProfile;
        setUser(userProfile);

        // Fetch all products owned by the user, regardless of status
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            transactions!transactions_product_id_fkey (
              id,
              status
            )
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (productsError) {
          console.error('Error fetching products:', productsError);
          throw productsError;
        }

        // Process the image URLs before setting the products
        const processedProducts = products?.map((product) => ({
          ...product,
          image_urls: Array.isArray(product.image_urls) 
            ? product.image_urls 
            : JSON.parse(product.image_urls || '[]')
        }));

        console.log('Fetched products:', processedProducts);
        setProducts(processedProducts || []);

        // Get cart count
        const { data: cartData, error: cartError } = await supabase
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
      toast.error('Failed to load dashboard data');
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
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
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {user.role === 'buyer' ? 'Marketplace' : ''}
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
          <h1 className="text-3xl font-bold">My Listings</h1>
          <div className="hidden md:flex gap-4">
            <Button asChild>
              <Link href="/feed">
                <Package className="mr-2 h-5 w-5" />
                Browse Products
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/products/new">
                <Plus className="mr-2 h-5 w-5" />
                Sell Now
              </Link>
            </Button>
          </div>
          <div className="flex flex-col gap-2 md:hidden w-full mt-4">
            <Button asChild>
              <Link href="/feed">
                <Package className="mr-2 h-5 w-5" />
                Browse Products
              </Link>
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
            {products?.length === 0 ? (
              <Card className="col-span-full p-8 text-center bg-white/80 backdrop-blur-sm border border-white/20">
                <h3 className="text-lg font-medium mb-4">No listings yet</h3>
                <Button asChild>
                  <Link href="/dashboard/products/new">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Your First Listing
                  </Link>
                </Button>
              </Card>
            ) : (
              products.map((product) => (
                <Link 
                  key={product.id} 
                  href={
                    product.status === 'in_escrow' || product.status === 'sold'
                      ? `/dashboard/transactions/${product.transactions?.[0]?.id}`
                      : `/dashboard/products/${product.id}/edit`
                  }
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm border border-white/20">
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
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                          product.status === 'available' ? 'bg-green-500' :
                          product.status === 'in_escrow' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}>
                          {product.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h2 className="font-semibold truncate">{product.title}</h2>
                      <p className="text-lg font-bold">₦{product.price}</p>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        ) : (
          <ProductGrid products={products} currentUserId={user?.id} />
        )}
      </main>
    </div>
  );
}
