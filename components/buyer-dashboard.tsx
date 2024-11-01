"use client";

import { Card } from "@/components/ui/card";
import { Product } from "@/types";
import ProductGrid from "./product-grid";
import { ShoppingBag, Wallet } from "lucide-react";

interface BuyerDashboardProps {
  purchases: Product[];
  walletBalance: number;
}

export default function BuyerDashboard({ purchases, walletBalance }: BuyerDashboardProps) {
  const activePurchases = purchases.filter(p => 
    p.status === 'available' || p.status === 'in_escrow'
  );
  const completedPurchases = purchases.filter(p => 
    p.status === 'sold'
  );

  return (
    <div className="space-y-6 p-6 rounded-lg">
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20">
          <div className="flex items-center gap-4">
            <ShoppingBag className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Active Orders</p>
              <p className="text-2xl font-bold">{activePurchases.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20">
          <div className="flex items-center gap-4">
            <Wallet className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Wallet Balance</p>
              <p className="text-2xl font-bold">₦{walletBalance}</p>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Active Orders</h2>
        <ProductGrid products={activePurchases} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Purchase History</h2>
        <ProductGrid products={completedPurchases} />
      </div>
    </div>
  );
}
