"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Product } from "@/types";

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <div className="relative aspect-square">
            <Image
              src={product.image_urls[0]}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="font-medium truncate">{product.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              ${product.min_price} - ${product.max_price}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
