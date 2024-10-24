"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link key={product.id} href={`/products/${product.id}`}>
          <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="relative aspect-square">
              {product.image_urls?.[0] && (
                <Image
                  src={product.image_urls[0]}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold truncate">{product.title}</h3>
              <p className="text-lg font-bold">${product.price}</p>
              {product.profiles && (
                <p className="text-sm text-muted-foreground">
                  Seller: {product.profiles.email}
                </p>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
