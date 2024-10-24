"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import ProductGrid from "@/components/product-grid";
import { createClient } from '@supabase/supabase-js';
import { RefreshCcw } from "lucide-react";
import GradientBackground from "@/components/ui/gradient-background";
import { Product } from "@/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FeedPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!seller_id (
            id,
            email,
            role
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched products:', data); // Add this for debugging
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen">
      <GradientBackground>
        <div className="container mx-auto py-8 px-4">
          <div className="backdrop-blur-md bg-white/30 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Product Feed
              </h1>
              <button 
                onClick={fetchProducts}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                disabled={loading}
              >
                <RefreshCcw className={`w-5 h-5 text-primary ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <RefreshCcw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <ProductGrid products={products} />
            </div>
          )}
        </div>
      </GradientBackground>
    </div>
  );
}
