import { useState, useEffect } from 'react';
import { WalletManager } from '@/lib/wallet';
import { supabase } from '@/lib/supabase';

export function useWallet() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletBalance();
  }, []);

  const loadWalletBalance = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const balance = await WalletManager.getWalletBalance(user.id);
        setBalance(balance);
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = () => {
    loadWalletBalance();
  };

  return {
    balance,
    loading,
    refreshBalance
  };
}
