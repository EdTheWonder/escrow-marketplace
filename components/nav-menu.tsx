"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { 
  User, 
  MessageSquare, 
  Home, 
  ShoppingBag, 
  Wallet, 
  Settings, 
  PlusCircle, 
  LogOut,
  Receipt
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, useSupabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function NavMenu({ role }: { role: string }) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingTransactions, setPendingTransactions] = useState(0);
  
  useEffect(() => {
    async function getUserProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();
        
        if (profile?.email) {
          setUserEmail(profile.email);
        }
      }
    }
    getUserProfile();
  }, []);
    
  useEffect(() => {
    const setupNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch initial counts
      const fetchCounts = async () => {
        // Get unread messages
        const { data: messages } = await supabase
          .from('messages')
          .select('id')
          .eq('recipient_id', user.id)
          .is('read_at', null);

        // Get pending transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('id')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .eq('status', 'in_escrow');

        setUnreadMessages(messages?.length || 0);
        setPendingTransactions(transactions?.length || 0);
      };

      fetchCounts();

      // Subscribe to changes
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        }, () => fetchCounts())
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `or(buyer_id.eq.${user.id},seller_id.eq.${user.id})`
        }, () => fetchCounts())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupNotifications();
  }, []);
    
  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      toast.error("Error signing out");
    } else {
      toast.success("Logged out successfully");
      router.push("/");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <div>
              My Account
              {userEmail && (
                <p className="text-sm text-muted-foreground mt-1">{userEmail}</p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/feed" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Products</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/transactions" className="flex items-center gap-2 relative">
            <Receipt className="w-4 h-4" />
            <span>Transactions</span>
            {pendingTransactions > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {pendingTransactions}
              </span>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/messages" className="flex items-center gap-2 relative">
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/wallet" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span>Wallet</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
