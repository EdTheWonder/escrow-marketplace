import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { updateProductStatus } from '@/lib/products';

export async function PATCH(request: Request) {
  try {
    const { productId, status } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await updateProductStatus(productId, status);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Product status update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product status' },
      { status: 500 }
    );
  }
}
