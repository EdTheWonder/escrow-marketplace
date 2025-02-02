// components/layout/header.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold">
          CompanyName
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link href="/buy">Buy</Link>
          <Link href="/sell">Sell</Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">
                <Wallet className="mr-2 h-4 w-4" />
                Wallet
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link href="/wallet/balance">Balance</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/wallet/transactions">Transactions</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">Dashboard</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link href="/dashboard/history">Trade History</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard/partners">Trade Partners</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard/offers">My Offers</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard/settings">Account Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}

