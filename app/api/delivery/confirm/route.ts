import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { confirmDelivery } from '@/lib/delivery';

export async function POST(request: Request) {
  try {
    console.log('Starting delivery confirmation...');
    const supabase = createRouteHandlerClient({ cookies });
    const { transactionId } = await request.json();
    console.log('TransactionId received:', transactionId);

    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session check:', !!session);
    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching transaction...');
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*, products(*)')
      .eq('id', transactionId)
      .single();

    if (txError) {
      console.error('Transaction fetch error:', txError);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    if (!transaction) {
      console.log('Transaction not found');
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    console.log('Transaction found:', {
      id: transaction.id,
      status: transaction.status,
      buyer_id: transaction.buyer_id,
      product_id: transaction.product_id
    });

    if (transaction.buyer_id !== session.user.id) {
      console.log('User not authorized:', {
        buyer_id: transaction.buyer_id,
        user_id: session.user.id
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('Calling confirmDelivery...');
    const result = await confirmDelivery(transactionId);
    console.log('Delivery confirmation result:', result);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delivery confirmation error:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message || 'Failed to confirm delivery' },
      { status: 500 }
    );
  }
}

