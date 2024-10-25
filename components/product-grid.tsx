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
          <div
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className="cursor-pointer"
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square">
                {product.image_urls?.[0] && (
                  <Image
                    src={product.image_urls[0]}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={(e) => {
                      console.error('Image load error:', {
                        src: product.image_urls[0],
                        productId: product.id,
                        error: e
                      });
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', {
                        src: product.image_urls[0],
                        productId: product.id
                      });
                    }}
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
          </div>
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
