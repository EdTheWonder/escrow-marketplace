"use client";

export default function GradientBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}

