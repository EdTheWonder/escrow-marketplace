import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { reference, transactionId, productId } = await request.json();

    // Set delivery deadline to 12 hours from now
    const deliveryDeadline = new Date(Date.now() + (12 * 60 * 60 * 1000));

    // Update both product and transaction status atomically
    const { error } = await supabase.rpc('sync_product_transaction_status', {
      p_product_id: productId,
      p_transaction_id: transactionId,
      p_status: 'in_escrow',
      p_delivery_deadline: deliveryDeadline.toISOString()
    });

    if (error) throw error;

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
