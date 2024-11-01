"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { supabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabaseClient.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      toast.error("Login failed");
    } else {
      toast.success("Logged in successfully");
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <Link href="/" className="text-2xl font-bold">
          EscrowMarket
        </Link>
      </div>
      <div className="min-h-[calc(100vh-88px)] flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-6 space-y-4 bg-gradient-to-br from-blue-50/80 via-blue-100/80 to-indigo-100/80 backdrop-blur-sm">
          <h1 className="text-2xl font-semibold text-center">Welcome Back</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
