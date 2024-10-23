"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Product } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import PurchaseButton from "./purchase-button";
import { useState } from "react";

export default function ProductGrid({ products }: { products: Product[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageError = (error: Error, productId: string, imageUrl: string) => {
    console.error(`Image load error for product ${productId}:`, {
      error: error.message,
      imageUrl,
      product: products.find(p => p.id === productId)
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden bg-white/80 backdrop-blur-sm">
            <DialogTrigger asChild>
              <div 
                className="aspect-video relative cursor-pointer" 
                onClick={() => setSelectedImage(product.image_urls?.[0])}
              >
                {product.image_urls?.[0] && (
                  <Image
                    src={product.image_urls[0]}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                    onError={(e) => handleImageError(
                      new Error('Image failed to load'),
                      product.id,
                      product.image_urls[0]
                    )}
                  />
                )}
              </div>
            </DialogTrigger>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{product.title}</h2>
              <p className="text-muted-foreground mb-4 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">${product.price}</span>
                <PurchaseButton product={product} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog>
        <DialogContent className="max-w-3xl">
          {selectedImage && (
            <div className="relative aspect-video">
              <Image
                src={selectedImage}
                alt="Product preview"
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
