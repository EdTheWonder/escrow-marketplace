import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { calculateSendboxDelivery } from '@/lib/sendbox';
import { toast } from 'sonner';

interface DeliveryMethodSelectorProps {
  productPrice: number;
  onSelect: (method: string, total: number) => Promise<void>;
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
        onClick={() => onSelect('meet_up', productPrice)}
        disabled={loading}
        className="w-full justify-between"
      >
        <span>Meet Up</span>
        <span>Free</span>
      </Button>
    </div>
  );
}
