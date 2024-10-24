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
    <>
      {products.map((product) => (
        <Dialog key={product.id}>
          <Card className="overflow-hidden backdrop-blur-md bg-white/30 border border-white/20 hover:bg-white/40 transition-all">
            {product.image_urls && product.image_urls[0] && (
              <div className="relative aspect-video">
                <Image
                  src={product.image_urls[0]}
                  alt={product.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {product.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                ${product.price}
              </p>
              <DialogTrigger asChild>
                <Button className="w-full mt-4 bg-primary/80 backdrop-blur-sm hover:bg-primary/90">
                  View Details
                </Button>
              </DialogTrigger>
            </div>
          </Card>
          <DialogContent className="backdrop-blur-md bg-white/80 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {product.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {product.image_urls && product.image_urls[0] && (
                <div className="relative aspect-video">
                  <Image
                    src={product.image_urls[0]}
                    alt={product.title}
                    fill
                    className="object-cover rounded-lg"
                    unoptimized
                  />
                </div>
              )}
              <p className="text-muted-foreground">{product.description}</p>
              <div className="flex justify-between items-center">
                <p className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  ${product.price}
                </p>
                <PurchaseButton product={product} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </>
  );
}
