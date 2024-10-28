// app/sell/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";

export default function SellPage() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-8">Create Sell Offer</h1>
      
      <form className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Product Details</h2>
          <Input placeholder="Product Title" required />
          <textarea
            className="w-full p-2 border rounded-md"
            placeholder="Description"
            rows={4}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input type="number" placeholder="Minimum Price" required />
            <Input type="number" placeholder="Maximum Price" required />
          </div>
          <Input
            type="number"
            max={180}
            placeholder="Payment Time Limit (minutes, max 180)"
            required
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Payment Details</h2>
          <Input placeholder="Bank Name" required />
          <Input placeholder="Account Number" required />
          <Input placeholder="Account Name" required />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
          />
          <label htmlFor="terms" className="text-sm">
            I accept the terms and conditions
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={!acceptedTerms}>
          Create Offer
        </Button>
      </form>
    </div>
  );
}

