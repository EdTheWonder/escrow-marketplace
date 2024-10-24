import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingBag, Package, History, Wallet, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function NavMenu({ role }: { role: 'buyer' | 'seller' }) {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    router.push("/");
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex flex-col gap-4 mt-8">
          <Link href="/feed" className="flex items-center gap-2 p-2 hover:bg-accent rounded-md">
            <Package className="h-5 w-5" />
            Product Feed
          </Link>
          
          <Link href="/dashboard" className="flex items-center gap-2 p-2 hover:bg-accent rounded-md">
            {role === 'buyer' ? (
              <ShoppingBag className="h-5 w-5" />
            ) : (
              <Package className="h-5 w-5" />
            )}
            Dashboard
          </Link>

          {role === 'seller' && (
            <Link href="/products" className="flex items-center gap-2 p-2 hover:bg-accent rounded-md">
              <Package className="h-5 w-5" />
              My Products
            </Link>
          )}

          <Link href="/dashboard/transactions" className="flex items-center gap-2 p-2 hover:bg-accent rounded-md">
            <History className="h-5 w-5" />
            Transactions
          </Link>

          <Link href="/dashboard/wallet" className="flex items-center gap-2 p-2 hover:bg-accent rounded-md">
            <Wallet className="h-5 w-5" />
            Wallet
          </Link>

          <Button variant="ghost" onClick={handleSignOut} className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
