import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { reference, transactionId, productId } = await request.json();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Set delivery deadline to 12 hours from now
    const deliveryDeadline = new Date(Date.now() + (12 * 60 * 60 * 1000));

    // Update statuses separately since our RPC doesn't handle deadline
    await Promise.all([
      supabase
        .from('products')
        .update({ status: 'in_escrow' })
        .eq('id', productId),
      supabase
        .from('transactions')
        .update({ 
          status: 'in_escrow',
          delivery_deadline: deliveryDeadline.toISOString()
        })
        .eq('id', transactionId)
        .eq('buyer_id', user.id)
    ]);

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
