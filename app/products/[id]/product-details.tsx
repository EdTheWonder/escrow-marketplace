"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useState } from "react";
import PurchaseButton from "@/components/purchase-button";
import ImageModal from "@/components/image-modal";
import GradientBackground from "@/components/ui/gradient-background";

interface ProductDetailsProps {
  product: any;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <GradientBackground>
      <div className="container mx-auto max-w-4xl p-4">
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {product.image_urls && product.image_urls.map((url: string, index: number) => (
                <div 
                  key={index} 
                  className="relative aspect-video cursor-pointer"
                  onClick={() => setSelectedImage(url)}
                >
                  <Image
                    src={url}
                    alt={`${product.title} - Image ${index + 1}`}
                    fill
                    className="rounded-lg object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
              <p className="text-2xl font-bold mb-4">${product.price}</p>
              <p className="text-muted-foreground mb-6">{product.description}</p>
              <p className="text-sm mb-6">Seller: {product.profiles.email}</p>
              <PurchaseButton product={product} />
            </div>
          </div>
        </Card>
      </div>
      
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage}
          alt={product.title}
        />
      )}
    </GradientBackground>
  );
}

