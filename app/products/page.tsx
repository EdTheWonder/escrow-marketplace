import ProductGrid from "@/components/product-grid";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Product Feed</h1>
            <p className="text-muted-foreground">
              Browse all available products from our sellers
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Package className="mr-2 h-5 w-5" />
              List Your Product
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ProductGrid products={products || []} />
        </div>
      </div>
    </div>
  );
}
