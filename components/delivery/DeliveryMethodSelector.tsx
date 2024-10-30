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

  async function handleMethodChange(value: string) {
    setMethod(value);
    
    if (value === 'sendbox') {
      window.location.href = `https://checkout.sendbox.co/initialize?key=${process.env.NEXT_PUBLIC_SENDBOX_KEY}`;
      return;
    }
    
    onSelect(value, productPrice);
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
    </div>
  );
}
