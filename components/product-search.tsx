"use client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ProductSearch({ onSearch }: { onSearch: (query: string) => void }) {
  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search products..."
        className="pl-10 w-full max-w-md"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
}
