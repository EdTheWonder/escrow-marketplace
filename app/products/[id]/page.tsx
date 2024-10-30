"use client";
import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import ProductDetails from "./product-details";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
      <Link href="/products" passHref>
        <Button 
          variant="ghost" 
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
      </Link>
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

