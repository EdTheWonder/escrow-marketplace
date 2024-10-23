export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  seller_id: string;
  status: 'available' | 'sold';
  created_at: string;
  profiles?: {
    email: string;
  };
}

