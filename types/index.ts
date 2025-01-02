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

export interface Transaction {
  id: string;
  status: 'pending' | 'in_escrow' | 'sold' | 'refunded' | 'disputed';
  amount: number;
  delivery_method: 'meetup' | 'sendbox';
  delivery_fee: number;
  delivery_status: 'pending' | 'in_transit' | 'delivered';
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  completed_at?: string;
  delivery_deadline?: string;
  products: {
    title: string;
    image_urls?: string[];
    status: string;
  };
  buyer: {
    email: string;
  };
  seller: {
    email: string;
  };
  messages?: {
    content: string;
    created_at: string;
    read_at: string | null;
    recipient_id: string;
  }[];
}
