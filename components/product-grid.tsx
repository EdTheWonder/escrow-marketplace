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

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Dialog key={product.id}>
          <Card className="overflow-hidden">
            {product.image_urls && (
              <div className="relative h-48 w-full">
                <Image
                  src={product.image_urls[0]}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold">{product.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                ${product.price}
              </p>
              <DialogTrigger asChild>
                <Button className="w-full mt-4" onClick={() => setSelectedProduct(product)}>
                  View Details
                </Button>
              </DialogTrigger>
            </div>
          </Card>
          <DialogContent>
            <div className="space-y-4">
              {product.image_urls && (
                <div className="relative h-64 w-full">
                  <Image
                    src={product.image_urls[0]}
                    alt={product.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
              <h2 className="text-2xl font-bold">{product.title}</h2>
              <p className="text-muted-foreground">{product.description}</p>
              <div className="flex justify-between items-center">
                <p className="text-xl font-bold">${product.price}</p>
                <PurchaseButton product={product} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
