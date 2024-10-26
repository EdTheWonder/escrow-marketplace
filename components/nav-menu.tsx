import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { supabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { History } from "lucide-react";

export default function NavMenu({ role }: { role: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Logged out successfully");
      router.push("/");
    }
  }

  return (
    <div className="relative group">
      <Button variant="ghost" size="icon">
        <Menu className="w-6 h-6" />
      </Button>
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1 hover:block">
          <a href="/feed" className="block px-4 py-2 hover:bg-gray-100">Browse Products</a>
          {role === 'seller' && (
            <a href="/products" className="block px-4 py-2 hover:bg-gray-100">My Products</a>
          )}
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
          >
            Sign Out
          </button>
          <a
            href="/dashboard/history"
            className="block px-4 py-2 hover:bg-gray-100"
          >
            History
          </a>
        </div>
      </div>
    </div>
  );
}
