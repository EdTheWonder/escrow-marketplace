import ProductGrid from "@/components/product-grid";
import { createServerSupabase } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import BackButton from "@/components/back-button";
import { Card } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const supabase = createServerSupabase();
  
  // Fetch seller's products
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'available')
    .not('status', 'in', ['in_escrow', 'sold', 'pending'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching seller products:', error);
    return <div className="text-red-500">Failed to load your products.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <BackButton />
        <div className="flex justify-between items-center mb-8">
          <div>
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
          {products.map(product => (
            <Card key={product.id} className="bg-white/80 backdrop-blur-sm border border-white/20">
              {/* ... rest of card content ... */}
              <p className="text-lg font-bold">₦{product.price}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
