"use client";

import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  postPayment?: boolean;
}

export default function BackButton({ postPayment }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (postPayment) {
      router.push('/dashboard');
    } else {
      router.back();
    }
  };

  return (
    <Button 
      variant="ghost" 
      onClick={handleBack}
      className="mb-4"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
  );
}
