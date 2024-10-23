import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EscrowMarket",
  description: "Secure marketplace with escrow protection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-200 to-blue-300 animate-gradient-xy">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
