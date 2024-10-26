"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Product } from "@/types";
import { useState } from "react";
import ProductModal from "./product-modal";

export default function ProductGrid({ products }: { products: Product[] }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card 
            key={product.id} 
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedProduct(product)}
          >
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

      {selectedProduct && (
        <ProductModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}
    </>
  );
}
