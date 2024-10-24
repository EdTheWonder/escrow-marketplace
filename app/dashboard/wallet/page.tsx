import WalletCard from "@/components/wallet/WalletCard";
import TransactionHistory from "@/components/wallet/TransactionHistory";

export const dynamic = 'force-dynamic';

export default function WalletPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <WalletCard />
      <TransactionHistory />
    </div>
  );
}

