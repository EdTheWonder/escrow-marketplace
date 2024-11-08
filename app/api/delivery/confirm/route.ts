import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EscrowService } from '@/lib/escrow';

export async function POST(request: Request) {
  console.log('Received delivery confirmation request');
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { transactionId } = await request.json();
    console.log('Processing transaction:', transactionId);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error('No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Authenticated user:', session.user.id);

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError) {
      console.error('Failed to fetch transaction:', txError);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }
    if (!transaction) {
      console.error('Transaction not found:', transactionId);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.buyer_id !== session.user.id) {
      console.error('Unauthorized: User is not the buyer', {
        userId: session.user.id,
        buyerId: transaction.buyer_id
      });
      return NextResponse.json(
        { error: 'Only the buyer can confirm delivery' },
        { status: 403 }
      );
    }

    console.log('Releasing payment to seller...');
    await EscrowService.releaseToSeller(transactionId);
    console.log('Payment released successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delivery confirmation failed:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to confirm delivery',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

