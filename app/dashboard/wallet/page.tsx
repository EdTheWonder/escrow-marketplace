import WalletCard from "@/components/wallet/WalletCard";
import TransactionHistory from "@/components/wallet/TransactionHistory";
import BackButton from "@/components/back-button";

export const dynamic = 'force-dynamic';

export default function WalletPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <BackButton />
      <div className="space-y-6">
        <WalletCard />
        <TransactionHistory />
      </div>
    </div>
  );
}
