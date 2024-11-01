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
import GradientBackground from "@/components/ui/gradient-background";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
      toast.error("Signup failed");
    } else {
      toast.success("Check your email to confirm your account");
      router.push("/auth/login");
    }
  }

  return (
    <GradientBackground>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <Card className="p-6 space-y-4 backdrop-blur-sm bg-white/80">
            <h1 className="text-2xl font-semibold text-center">Create Account</h1>
            <form onSubmit={handleSignUp} className="space-y-4">
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
                Sign Up
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </GradientBackground>
  );
}
