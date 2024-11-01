import { ReactNode } from "react";

export interface Product {
  transactions: any;
  max_price: ReactNode;
  min_price: ReactNode;
  profiles: any;
  id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  status: 'available' | 'in_escrow' | 'sold';
  seller_id: string;
  created_at: string;
  seller: {
    id: string;
    email: string;
    role: string;
  };
}

export interface UserProfile {
  id: string | undefined;
  role: 'buyer' | 'seller';
  email?: string;
  // Add any other user profile fields you're using
}

export interface SellOffer {
  product_id: string;
  seller_id: string;
  min_price: number;
  max_price: number;
  payment_window: number; // in minutes, max 180
  bank_account_id: string;
  terms_accepted: boolean;
}
