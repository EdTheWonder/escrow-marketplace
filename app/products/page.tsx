import ProductGrid from "@/components/product-grid";
import { supabase } from "@/lib/supabase";

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
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Available Products</h1>
        <ProductGrid products={products || []} />
      </div>
    </div>
  );
}
