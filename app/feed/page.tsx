"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BackButton from "@/components/back-button";
import { Plus } from "lucide-react";
import ProductSearch from "@/components/product-search";

<ProductSearch onSearch={handleSearch} />

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
  created_at: string | number | Date;
  id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];  // Changed from string to string[]
  status: string;
}

export default function FeedPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    }
    
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const processedData = data.map(product => ({
          ...product,
          image_urls: Array.isArray(product.image_urls) 
            ? product.image_urls 
            : typeof product.image_urls === 'string'
            ? JSON.parse(product.image_urls)
            : []
        }));
        setProducts(processedData);
        setFilteredProducts(processedData);
      }
    }

    checkAuth();
    fetchProducts();
  }, []);

  const handleSearch = (query: string, filter: string, sort: string) => {
    let filtered = [...products];

    // Apply search query
    if (query) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply status filter
    if (filter === 'available') {
      filtered = filtered.filter(p => p.status === 'available');
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case 'price_high':
          return b.price - a.price;
        case 'price_low':
          return a.price - b.price;
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredProducts(filtered);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href={isAuthenticated ? "/dashboard" : "/"}>
          <Button variant="ghost">
            ← Back to {isAuthenticated ? "Dashboard" : "Home"}
          </Button>
        </Link>
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Product Feed</h1>
        {isAuthenticated && (
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Plus className="mr-2 h-5 w-5" />
              Add Product
            </Link>
          </Button>
        )}
      </div>
      <ProductSearch onSearch={handleSearch} />
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Link key={product.id} href={`/products/${product.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square">
                {Array.isArray(product.image_urls) && product.image_urls[0] && (
                  <Image
                    src={typeof product.image_urls[0] === 'string' ? product.image_urls[0] : ''}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                    unoptimized
                  />
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold truncate">{product.title}</h2>
                <p className="text-lg font-bold">₦{product.price}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {product.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function handleSearch(query: string, filter: string, sort: string): void {
  throw new Error("Function not implemented.");
}

