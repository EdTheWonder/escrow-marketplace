"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CartButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getCartCount();
  }, []);

  async function getCartCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { count } = await supabase
        .from('cart')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);
      
      setCount(count || 0);
    }
  }

  return (
    <Button variant="ghost" className="relative">
      <ShoppingCart className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">
          {count}
        </span>
      )}
    </Button>
  );
}

