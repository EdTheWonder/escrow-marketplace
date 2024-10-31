"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Product } from "@/types";
import { Badge } from "@/components/ui/badge";

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product.id} className="relative">
          <Badge 
            className={`absolute top-2 right-2 z-10 ${getStatusColor(product.status)}`}
          >
            {product.status || 'available'}
          </Badge>
          <Card className="overflow-hidden">
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
        </div>
      ))}
    </div>
  );
}
