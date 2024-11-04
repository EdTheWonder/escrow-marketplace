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
import { User, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseClient, useSupabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function NavMenu({ role }: { role: string }) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  
  useEffect(() => {
    async function getUserProfile() {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        const { data: profile } = await supabaseClient
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
    
  async function handleSignOut() {
    const { error } = await supabaseClient.auth.signOut();
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
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          My Account
          {userEmail && (
            <p className="text-sm text-muted-foreground mt-1">{userEmail}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/transactions">Transactions</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link 
            href="/messages" 
            className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-lg"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600" onClick={handleSignOut}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
