"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import BackButton from "@/components/back-button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];  // Changed from string to string[]
  status: string;
}

export default function FeedPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          description,
          price,
          image_urls,
          status
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (!error && data) {
        console.log('Fetched products:', data); // Debug log
        setProducts(data);
      }
    }

    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <BackButton />
      </div>
      <h1 className="text-3xl font-bold mb-8">Product Feed</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square">
                {product.image_urls?.[0] && (
                  <Image
                    src={product.image_urls[0]}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                  />
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold truncate">{product.title}</h2>
                <p className="text-lg font-bold">${product.price}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {product.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
