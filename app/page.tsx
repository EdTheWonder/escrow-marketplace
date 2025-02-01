"use client";

import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Package } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    }
    checkAuth();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            Deshuffle
          </Link>
          <nav className="space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Secure Marketplace with Escrow Protection
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Buy and sell with confidence. Your payments are protected until delivery is confirmed.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/feed">
              <Package className="mr-2 h-5 w-5" />
              Browse Product Feed
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/signup">Start Selling</Link>
          </Button>
        </div>
      </section>

      <section className="bg-muted py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">1. List Your Product</h3>
              <p className="text-muted-foreground">
                Create detailed listings with images and set your price.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">2. Secure Payment</h3>
              <p className="text-muted-foreground">
                Buyers pay through our escrow system for protection.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">3. Safe Delivery</h3>
              <p className="text-muted-foreground">
                Payment is released after delivery confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
