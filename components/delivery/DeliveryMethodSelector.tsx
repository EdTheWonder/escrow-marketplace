import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { calculateSendboxDelivery } from '@/lib/sendbox';
import { toast } from 'sonner';

interface DeliveryMethodProps {
  productPrice: number;
  onSelect: (method: string, totalPrice: number) => void;
}

export default function DeliveryMethodSelector({ productPrice, onSelect }: DeliveryMethodProps) {
  const [method, setMethod] = useState<string>('');
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  async function handleMethodChange(value: string) {
    setMethod(value);
    setLoading(true);

    if (value === 'sendbox') {
      try {
        const price = await calculateSendboxDelivery();
        setDeliveryPrice(price);
        onSelect(value, productPrice + price);
      } catch (error) {
        toast.error('Failed to calculate delivery price');
      }
    } else {
      setDeliveryPrice(0);
      onSelect(value, productPrice);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <RadioGroup onValueChange={handleMethodChange} value={method}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="seller" id="seller" />
          <Label htmlFor="seller">Seller Delivery</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sendbox" id="sendbox" />
          <Label htmlFor="sendbox">Sendbox Delivery</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="pickup" id="pickup" />
          <Label htmlFor="pickup">Pickup from Seller</Label>
        </div>
      </RadioGroup>

      {method === 'sendbox' && deliveryPrice > 0 && (
        <div className="text-sm space-y-2">
          <p>Product Price: ${productPrice}</p>
          <p>Delivery Fee: ${deliveryPrice}</p>
          <p className="font-semibold">Total: ${productPrice + deliveryPrice}</p>
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Calculating delivery price...</p>}
    </div>
  );
}
