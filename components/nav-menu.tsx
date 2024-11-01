import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { supabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { History } from "lucide-react";
import Link from "next/link";

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
    <div className="flex items-center gap-4">
      <Link href="/feed" className="text-sm font-medium">
        Browse Products
      </Link>
      {role === 'seller' && (
        <Link href="/products" className="text-sm font-medium">
          ""
        </Link>
      )}
      <div className="relative group">
        <Button variant="ghost" size="icon">
          <Menu className="w-6 h-6" />
        </Button>
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="py-1">
            <a href="/dashboard/history" className="block px-4 py-2 hover:bg-gray-100">
              <History className="w-4 h-4 inline mr-2" />
              History
            </a>
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
