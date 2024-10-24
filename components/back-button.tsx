import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function BackButton() {
  return (
    <Button variant="ghost" size="sm" asChild className="mb-4">
      <Link href="/dashboard" className="flex items-center gap-2">
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </Button>
  );
}
