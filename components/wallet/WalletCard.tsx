"use client";

import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/utils";

export default function WalletCard() {
  const { balance, loading } = useWallet();

  return (
    <div className="bg-white/30 backdrop-blur-md rounded-lg p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-2">Wallet Balance</h2>
      <div className="text-3xl font-bold">
        {loading ? (
          <div className="animate-pulse h-8 w-32 bg-gray-200 rounded" />
        ) : (
          formatCurrency(balance)
        )}
      </div>
    </div>
  );
}

