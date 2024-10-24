"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { supabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleLogin() {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login error:', error);
      toast.error("Login failed");
    } else {
      toast.success("Logged in successfully");
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <Button onClick={handleLogin}>Login</Button>
        </div>
        <p className="mt-4 text-sm">
          Don&apos;t have an account? <Link href="/auth/signup" className="text-primary">Register</Link>
        </p>
      </Card>
    </div>
  );
}
