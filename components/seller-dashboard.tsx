"use client";

import { Card } from "@/components/ui/card";
import { Product } from "@/types";
import ProductGrid from "./product-grid";
import { Package, DollarSign } from "lucide-react";

interface SellerDashboardProps {
  products: Product[];
  earnings: number;
}

export default function SellerDashboard({ products, earnings }: SellerDashboardProps) {
  const activeListings = products.filter(p => p.status === 'available');
  const soldItems = products.filter(p => p.status === 'sold');

  return (
    <div className="space-y-6 p-6 rounded-lg">
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Package className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Active Listings</p>
              <p className="text-2xl font-bold">{activeListings.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <DollarSign className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold">${earnings}</p>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Listings</h2>
        <ProductGrid products={activeListings} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Sold Items</h2>
        <ProductGrid products={soldItems} />
      </div>
    </div>
  );
}
