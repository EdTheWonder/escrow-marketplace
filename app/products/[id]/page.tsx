import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import PurchaseButton from "@/components/purchase-button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import GradientBackground from "@/components/ui/gradient-background";

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
      profiles:seller_id (
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
    <GradientBackground>
      <div className="container mx-auto max-w-4xl p-4">
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {product.image_urls && product.image_urls.map((url: string, index: number) => (
                <div key={index} className="relative aspect-video">
                  <Image
                    src={url}
                    alt={`${product.title} - Image ${index + 1}`}
                    fill
                    className="rounded-lg object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
              <p className="text-2xl font-bold mb-4">${product.price}</p>
              <p className="text-muted-foreground mb-6">{product.description}</p>
              <p className="text-sm mb-6">Seller: {product.profiles.email}</p>
              <PurchaseButton product={product} />
            </div>
          </div>
        </Card>
      </div>
    </GradientBackground>
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
