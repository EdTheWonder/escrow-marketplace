import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import ProductDetails from "./product-details";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default async function ProductPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles (
        id,
        email
      )
    `)
    .eq('id', id)
    .single();

  if (error || !product) {
    console.error('Product not found:', error);
    notFound();
  }

  const router = useRouter();

  return (
    <div className="container mx-auto py-8">
      <Button 
        onClick={() => router.back()} 
        variant="ghost" 
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Products
      </Button>
      <ProductDetails product={product} />
    </div>
  );
}

export async function generateStaticParams() {
  const supabase = createServerSupabase();
  const { data: products, error } = await supabase
    .from('products')
    .select('id');

  if (error) {
    console.error('Error fetching product IDs:', error);
    return [];
  }

  return (products || []).map((product) => ({
    id: product.id,
  }));
}
