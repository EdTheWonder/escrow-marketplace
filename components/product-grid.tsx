"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Product } from "@/types";
import { useState } from "react";
import ProductModal from "./product-modal";

export default function ProductGrid({ products }: { products: Product[] }) {
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  const handleImageError = (productId: string, url: string) => {
    console.error('Image load failed:', {
      productId,
      url,
      imageUrls: products.find(p => p.id === productId)?.image_urls,
      timestamp: new Date().toISOString()
    });
    setImageError(prev => ({ ...prev, [productId]: true }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative aspect-square">
            {product.image_urls && (
              <Image
                src={Array.isArray(product.image_urls) 
                  ? product.image_urls[0] 
                  : typeof product.image_urls === 'string'
                  ? product.image_urls
                  : ''}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                unoptimized
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
      ))}
    </div>
  );
}
