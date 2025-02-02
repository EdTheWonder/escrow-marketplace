import { Button } from "@/components/ui/button";
import { DeliveryMethod } from "@/lib/transactions";

interface DeliveryMethodSelectorProps {
  productPrice: number;
  onSelect: (method: DeliveryMethod, total: number) => Promise<void>;
  loading?: boolean;
}

export default function DeliveryMethodSelector({ 
  productPrice, 
  onSelect,
  loading = false 
}: DeliveryMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <Button 
        onClick={() => onSelect('sendbox', productPrice + 1000)}
        disabled={loading}
        className="w-full justify-between"
      >
        <span>Sendbox Delivery</span>
        <span>₦1,000</span>
      </Button>

      <Button
        onClick={() => onSelect('meetup', productPrice)}
        disabled={loading}
        className="w-full justify-between"
      >
        <span>Meet Up</span>
        <span>Free</span>
      </Button>
    </div>
  );
}
