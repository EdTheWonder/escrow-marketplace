'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProductDetailPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8">
      <Button 
        onClick={() => router.back()} 
        variant="ghost" 
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Products
      </Button>
      {/* Rest of product detail content */}
    </div>
  );
}
