"use client";

export default function GradientBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-200 to-blue-300 animate-gradient-xy">
      {children}
    </div>
  );
}

