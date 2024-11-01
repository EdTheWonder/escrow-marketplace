import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    id: string;
  };
}

export default async function EditProductPage({ params }: Props) {
  const supabase = createServerSupabase();
  
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      {/* Add your edit form here */}
    </div>
  );
} 