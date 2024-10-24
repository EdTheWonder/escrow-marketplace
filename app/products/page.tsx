import ProductGrid from "@/components/product-grid";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ProductsPage() {
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      profiles:seller_id (
        email
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Latest Products</h1>
        <ProductGrid products={products || []} />
      </div>
    </div>
  );
}
