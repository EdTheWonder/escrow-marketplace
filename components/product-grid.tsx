"use client";

import { Card } from "./ui/card";
import { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  currentUserId?: string;
}

export default function ProductGrid({ products, currentUserId }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border border-white/20">
        <h3 className="text-lg font-medium mb-4">No listings yet</h3>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-5 w-5" />
            Sell Now
          </Link>
        </Button>
      </Card>
    );
  }

  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'in_escrow':
        return 'bg-yellow-500';
      case 'sold':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => {
        const isOwner = currentUserId === product.seller_id;
        
        return (
          <Link 
            key={product.id} 
            href={
              isOwner && product.status === 'available' 
                ? `/dashboard/products/${product.id}/edit`
                : product.status === 'in_escrow' || product.status === 'sold'
                  ? `/dashboard/transactions/${product.transactions?.[0]?.id}`
                  : `/products/${product.id}`
            }
            className={isOwner ? 'cursor-pointer' : ''}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm border border-white/20">
              <div className="relative aspect-square">
                {product.image_urls?.[0] && (
                  <Image
                    src={product.image_urls[0]}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                    unoptimized
                  />
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(product.status)}`}>
                    {product.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h2 className="font-semibold truncate">{product.title}</h2>
                <p className="text-lg font-bold">₦{product.price}</p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
