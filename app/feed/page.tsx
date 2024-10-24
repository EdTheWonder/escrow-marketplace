import ProductGrid from "@/components/product-grid";
import { supabase } from "@/lib/supabase";
import { RefreshCcw } from "lucide-react";

export default async function FeedPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">Product Feed</h1>
          <RefreshCcw className="w-5 h-5 text-muted-foreground" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ProductGrid products={products || []} />
        </div>
      </div>
    </div>
  );
}

