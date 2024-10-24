import ProductGrid from "@/components/product-grid";
import { createServerSupabase } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import BackButton from "@/components/back-button";

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const supabase = createServerSupabase();
  
  // Fetch seller's products
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles:seller_id (
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching seller products:', error);
    return <div className="text-red-500">Failed to load your products.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        <BackButton />
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Products</h1>
            <p className="text-muted-foreground">
              Manage your product listings
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Plus className="mr-2 h-5 w-5" />
              New Product
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
