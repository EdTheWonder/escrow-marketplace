import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import ProductDetails from "./product-details";
import BackButton from "@/components/back-button";

// Add this line to force dynamic rendering
export const dynamic = 'force-dynamic';

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

