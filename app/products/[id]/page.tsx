import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import PurchaseButton from "@/components/purchase-button";
import { Card } from "@/components/ui/card";

export default async function ProductPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const supabase = createServerComponentClient({ cookies });

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      profiles:seller_id (
        email
      )
    `)
    .eq('id', id)
    .single();

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {product.image_urls.map((url: string, index: number) => (
                <img
                  key={index}
                  src={url}
                  alt={`${product.title} - Image ${index + 1}`}
                  className="w-full rounded-lg"
                />
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
    </div>
  );
}

export async function generateStaticParams() {
  const supabase = createServerComponentClient({ cookies });
  const { data: products } = await supabase
    .from('products')
    .select('id');

  return (products || []).map((product) => ({
    id: product.id,
  }));
}
