"use client";

import { useState, useEffect } from "react";
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
  const [currentStatus, setCurrentStatus] = useState(status);
  const supabase = createClientComponentClient();

  // Listen for both transaction and product updates
  useEffect(() => {
    const channel = supabase
      .channel(`transaction-${transactionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `id=eq.${transactionId}`
      }, (payload: { new: { status?: string; delivery_status?: string } }) => {
        console.log('Transaction update received:', payload);
        if (payload.new.status === 'completed' || payload.new.delivery_status === 'delivered') {
          setIsDelivered(true);
          setCurrentStatus('completed');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactionId, supabase]);

  // Check initial status
  useEffect(() => {
    async function checkStatus() {
      const { data: transaction } = await supabase
        .from('transactions')
        .select(`
          status,
          delivery_status,
          buyer_id,
          product_id,
          products (
            status
          )
        `)
        .eq('id', transactionId)
        .single();

      console.log('Current transaction state:', transaction);
      
      if (transaction) {
        const { data: { user } } = await supabase.auth.getUser();
        setIsBuyer(transaction.buyer_id === user?.id);
        setCurrentStatus(transaction.status);
        setIsDelivered(
          transaction.status === 'completed' || 
          transaction.delivery_status === 'delivered'
        );
      }
    }
    
    checkStatus();
  }, [transactionId, supabase]);

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
            {currentStatus === 'completed' ? 'Delivered' : 
             currentStatus === 'in_escrow' ? 'In Transit' : 
             'Pending'}
          </h3>
          {deliveredAt && (
            <p className="text-sm text-gray-600">
              Delivered on {new Date(deliveredAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {!isDelivered && isBuyer && (
        <ConfirmDeliveryButton 
          transactionId={transactionId} 
          onSuccess={() => {
            setIsDelivered(true);
            setCurrentStatus('completed');
          }}
        />
      )}
    </div>
  );
}

