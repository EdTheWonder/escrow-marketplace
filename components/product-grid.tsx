"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

function getStatusColor(status: string) {
  switch (status) {
    case 'available':
      return 'bg-green-500';
    case 'in_escrow':
      return 'bg-blue-500';
    case 'sold':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link key={product.id} href={`/products/${product.id}`}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50/80 via-blue-100/80 to-indigo-100/80 backdrop-blur-sm">
            <div className="relative aspect-square">
              {Array.isArray(product.image_urls) && product.image_urls[0] && (
                <Image
                  src={product.image_urls[0]}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                  unoptimized
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
  );
}
