"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import Image from 'next/image';
import BackButton from "@/components/back-button";
import { supabase } from "@/lib/supabase";

interface ProductData {
  title: string;
  description: string;
  price: string;
  image_urls: string[];
}

export default function EditProduct({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductData>({
    title: '',
    description: '',
    price: '',
    image_urls: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        toast.error('Failed to load product');
        return;
      }

      if (product) {
        setFormData({
          title: product.title,
          description: product.description,
          price: product.price.toString(),
          image_urls: product.image_urls || []
        });
      }
    }

    loadProduct();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);

      if (error) throw error;

      toast.success('Product updated successfully');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error('Failed to update product: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <BackButton />
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (in Naira)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Product'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
