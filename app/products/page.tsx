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
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-200 to-blue-300 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Available Products</h1>
          <Button asChild>
            <Link href="/auth/login">Sign in to Purchase</Link>
          </Button>
        </div>
        <ProductGrid products={products || []} isPublic />
      </div>
    </div>
  );
}
