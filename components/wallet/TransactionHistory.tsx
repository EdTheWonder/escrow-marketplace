"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch wallet transactions
    const fetchTransactions = async () => {
      const { data } = await fetch('/api/wallet-transactions')
        .then(response => response.json());
      const sortedData = data?.sort((a: { created_at: string | number | Date; }, b: { created_at: string | number | Date; }) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTransactions(sortedData || []);
      setLoading(false);
    };

    fetchTransactions();
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Transaction History</h3>
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx: any) => (
            <div key={tx.id} className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
              <div className="flex justify-between">
                <div>
                  <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                  <div className="text-sm text-gray-600">
                    {formatDate(tx.created_at)}
                  </div>
                </div>
                <div className={`font-semibold ${
                  tx.type.includes('release') ? 'text-green-600' : 
                  tx.type.includes('hold') ? 'text-orange-600' : 
                  'text-red-600'
                }`}>
                  {tx.type.includes('hold') ? '-' : '+'}{formatCurrency(tx.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
