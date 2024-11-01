"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import BackButton from "@/components/back-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  async function fetchProduct() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (data) setProduct(data);
  }

  async function handleDelete() {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', params.id);

      if (error) throw error;
      toast.success("Product deleted successfully");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({
          title: product.title,
          description: product.description,
          price: product.price
        })
        .eq('id', params.id);

      if (error) throw error;
      toast.success("Product updated successfully");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!product) return null;

  return (
    <div className="container mx-auto py-8">
      <BackButton />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Listing</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your product listing.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <Input
          value={product.title}
          onChange={e => setProduct({...product, title: e.target.value})}
          placeholder="Product Title"
          required
        />
        <Textarea
          value={product.description}
          onChange={e => setProduct({...product, description: e.target.value})}
          placeholder="Product Description"
          required
        />
        <Input
          type="number"
          value={product.price}
          onChange={e => setProduct({...product, price: e.target.value})}
          placeholder="Price"
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
} 