import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import ProductDetails from "./product-details";
import BackButton from "@/components/back-button";

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

  return (
    <div className="container mx-auto py-8">
      <BackButton />
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

