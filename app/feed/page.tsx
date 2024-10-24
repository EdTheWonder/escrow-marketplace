import ProductGrid from "@/components/product-grid";
import { createServerSupabase } from "@/lib/supabase-server";
import { RefreshCcw } from "lucide-react";
import GradientBackground from "@/components/ui/gradient-background";

export default async function FeedPage() {
  const supabase = createServerSupabase();
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
    <div className="min-h-screen">
      <GradientBackground>
        <div className="container mx-auto py-8 px-4">
          <div className="backdrop-blur-md bg-white/30 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Product Feed
              </h1>
              <RefreshCcw className="w-5 h-5 text-primary animate-spin hover:animate-none cursor-pointer" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ProductGrid products={products || []} />
          </div>
        </div>
      </GradientBackground>
    </div>
  );
}
