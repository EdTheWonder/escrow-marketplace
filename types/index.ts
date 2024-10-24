export interface Product {
  profiles: any;
  id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  status: 'available' | 'sold';
  seller_id: string;
  created_at: string;
  seller: {
    id: string;
    email: string;
    role: string;
  };
}

export interface UserProfile {
  role: 'buyer' | 'seller';
  email?: string;
  // Add any other user profile fields you're using
}
