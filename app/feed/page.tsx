"use client";

import { useEffect, useState } from "react";
import ProductGrid from "@/components/product-grid";
import { supabaseClient } from "@/lib/supabase"; // Use the shared client
import { RefreshCcw } from "lucide-react";
import GradientBackground from "@/components/ui/gradient-background";
import { Product } from "@/types";

export default function FeedPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('products')
        .select(`
          *,
          profiles:seller_id (
            email
          )
        `)
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

  useEffect(() => {
    fetchProducts();
  }, []);

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
            <ProductGrid products={products} />
          )}
        </div>
      </GradientBackground>
    </div>
  );
}
