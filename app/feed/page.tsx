"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GradientBackground from "@/components/ui/gradient-background";
import { RefreshCcw } from "lucide-react";
import { Product, UserProfile } from "@/types";

export default function FeedPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user.user_metadata as UserProfile);
      fetchProducts();
    }
    init();
  }, [router]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('products')
        .select('*, profiles:seller_id(email)')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <GradientBackground>
        <div className="container mx-auto py-8 px-4">
          <div className="backdrop-blur-md bg-white/30 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Product Feed</h1>
              <button 
                onClick={fetchProducts}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                disabled={loading}
              >
                <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <RefreshCcw className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square">
                      {product.image_urls?.[0] && (
                        <Image
                          src={product.image_urls[0]}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                          priority
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="font-semibold truncate">{product.title}</h2>
                      <p className="text-lg font-bold">${product.price}</p>
                      <p className="text-sm text-muted-foreground">
                        Seller: {product.profiles?.email}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </GradientBackground>
    </div>
  );
}
