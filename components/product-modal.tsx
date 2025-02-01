"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PurchaseButton from "./purchase-button";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export default function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.image_urls.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.image_urls.length - 1 : prev - 1
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product.title}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative aspect-square">
            {product.image_urls?.[currentImageIndex] && (
              <>
                <Image
                  src={product.image_urls[currentImageIndex]}
                  alt={product.title}
                  fill
                  className="object-cover rounded-lg"
                />
                {product.image_urls.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between p-2">
                    <button onClick={prevImage} className="bg-black/50 p-1 rounded-full text-white">
                      <ChevronLeft />
                    </button>
                    <button onClick={nextImage} className="bg-black/50 p-1 rounded-full text-white">
                      <ChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="space-y-4">
            <p className="text-2xl font-bold">${product.price}</p>
            <p className="text-muted-foreground">{product.description}</p>
            <p className="text-sm">Seller: {product.profiles?.email}</p>
            <PurchaseButton product={product} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
