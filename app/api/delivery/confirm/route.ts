import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { transactionId } = await request.json();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Begin transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .eq('buyer_id', user.id)
      .select()
      .single();

    if (txError) throw txError;

    // Update product status
    const { error: productError } = await supabase
      .from('products')
      .update({ status: 'sold' })
      .eq('id', transaction.product_id);

    if (productError) throw productError;

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Delivery confirmation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm delivery' }, 
      { status: 500 }
    );
  }
}

