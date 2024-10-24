"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Truck, Clock } from "lucide-react";
import ConfirmDeliveryButton from "./ConfirmDeliveryButton";

interface Props {
  transactionId: string;
  status: string;
  deliveredAt?: string;
}

export default function DeliveryStatus({ transactionId, status, deliveredAt }: Props) {
  const [isDelivered, setIsDelivered] = useState(status === 'delivered');

  return (
    <div className="bg-white/30 backdrop-blur-md rounded-lg p-6">
      <div className="flex items-center gap-4 mb-4">
        {isDelivered ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : (
          <Truck className="w-6 h-6 text-orange-500" />
        )}
        <div>
          <h3 className="font-semibold">
            {isDelivered ? 'Delivered' : 'In Transit'}
          </h3>
          {deliveredAt && (
            <p className="text-sm text-gray-600">
              Delivered on {new Date(deliveredAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {!isDelivered && (
        <ConfirmDeliveryButton 
          transactionId={transactionId} 
          onSuccess={() => setIsDelivered(true)}
        />
      )}
    </div>
  );
}

