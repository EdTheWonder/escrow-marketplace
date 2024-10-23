"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Product } from "@/types/index";
import Image from "next/image";

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden bg-white/80 backdrop-blur-sm">
          <div className="aspect-video relative">
            {product.image_urls && product.image_urls.length > 0 && (
              <Image
                src={product.image_urls[0]}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
            )}
          </div>
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-2">{product.title}</h2>
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {product.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">${product.price}</span>
              <Button asChild>
                <Link href={`/products/${product.id}`}>View Details</Link>
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
