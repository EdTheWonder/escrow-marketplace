"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import Image from 'next/image';  // Add this import at the top
import BackButton from "@/components/back-button";
import { uploadToR2 } from "@/lib/cloudflare-r2";
import { createProduct } from '@/lib/products';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export default function NewProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      if (images.length + newImages.length > 5) {
        toast.error('Maximum 5 images allowed');
        return;
      }
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!formData.title || !formData.description || !formData.price || images.length === 0) {
        throw new Error("Please fill all required fields and add at least one image");
      }

      // Upload images to R2
      const imageUrls = [];
      for (const image of images) {
        const publicUrl = await uploadToR2(image);
        imageUrls.push(publicUrl);
      }

      // Use the createProduct function instead of direct insert
      await createProduct({
        seller_id: user.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        image_urls: imageUrls,
      });

      toast.success("Product listed successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error('Product creation failed:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <BackButton />
      <Card className="max-w-2xl mx-auto p-6 bg-white/80 backdrop-blur-sm border border-white/20">
        <h1 className="text-2xl font-bold mb-6">Create New Listing</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Product title"
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
              placeholder="Describe your product"
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
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <select
              id="location"
              name="location"
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select State</option>
              {nigerianStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
                <ImagePlus className="w-8 h-8 text-muted-foreground" />
              </label>
              {images.map((image, index) => (
                <div key={index} className="w-32 h-32 relative">
                  <Image 
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index}`}
                    width={128}
                    height={128}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating Listing..." : "Create Listing"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
