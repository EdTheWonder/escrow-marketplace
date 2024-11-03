"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useState, useMemo, ReactNode } from "react";
import PurchaseButton from "@/components/purchase-button";
import ImageModal from "@/components/image-modal";

interface ProductDetailsProps {
  product: {
    payment_window: ReactNode;
    id: string;
    title: string;
    description: string;
    price: number;
    status: string;
    image_urls: string | string[];
    seller_id: string;
    profiles: {
      id: string;
      email: string;
    };
  };
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Safely parse image URLs
  const imageUrls = useMemo(() => {
    try {
      if (Array.isArray(product.image_urls)) {
        return product.image_urls;
      }
      if (typeof product.image_urls === 'string') {
        return JSON.parse(product.image_urls);
      }
      return [];
    } catch (error) {
      console.error('Error parsing image URLs:', error);
      return [];
    }
  }, [product.image_urls]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl p-4">
        <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {imageUrls.map((url: string, index: number) => (
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
                    unoptimized
                  />
                </div>
              ))}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
              <p className="text-2xl font-bold mb-4">${product.price}</p>
              <p className="text-muted-foreground mb-6">{product.description}</p>
              <p className="text-sm mb-6">Seller: {product.profiles.email}</p>
              <p className="text-sm mb-6">Payment Window: {Number(product.payment_window)} hours</p>
              <PurchaseButton product={{...product, payment_window: Number(product.payment_window), status: 'active'}} />
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
    </div>
  );
}
