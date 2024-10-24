"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Product } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PurchaseButton from "./purchase-button";

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Dialog key={product.id}>
          <Card className="overflow-hidden">
            {product.image_urls && product.image_urls[0] && (
              <div className="relative h-48 w-full">
                <img
                  src={product.image_urls[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold">{product.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                ${product.price}
              </p>
              <DialogTrigger asChild>
                <Button className="w-full mt-4">
                  View Details
                </Button>
              </DialogTrigger>
            </div>
          </Card>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{product.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {product.image_urls && product.image_urls[0] && (
                <div className="relative h-64 w-full">
                  <img
                    src={product.image_urls[0]}
                    alt={product.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
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
