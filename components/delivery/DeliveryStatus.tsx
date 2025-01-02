"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Truck } from "lucide-react";
import ConfirmDeliveryButton from "./ConfirmDeliveryButton";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface Props {
  transactionId: string;
  status: string;
  deliveredAt?: string;
}

export default function DeliveryStatus({ transactionId, status, deliveredAt }: Props) {
  const [isDelivered, setIsDelivered] = useState(status === 'delivered');
  const [isBuyer, setIsBuyer] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      const { data: transaction } = await supabase
        .from('transactions')
        .select('buyer_id')
        .eq('id', transactionId)
        .single();
        
      setIsBuyer(transaction?.buyer_id === user.id);
    }
    
    checkUser();
  }, [transactionId]);

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
            {status === 'sold' ? 'Delivered' : 
             status === 'in_escrow' ? 'In Transit' : 
             'Pending'}
          </h3>
          {deliveredAt && (
            <p className="text-sm text-gray-600">
              Delivered on {new Date(deliveredAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {!isDelivered && isBuyer && userId && (
        <ConfirmDeliveryButton 
          transactionId={transactionId}
          userId={userId}
          onSuccess={() => setIsDelivered(true)}
        />
      )}
    </div>
  );
}

