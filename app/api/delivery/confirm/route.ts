import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EscrowService } from '@/lib/escrow';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { transactionId } = await request.json();

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the transaction details
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Verify the user is the buyer
    if (transaction.buyer_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the buyer can confirm delivery' },
        { status: 403 }
      );
    }

    // Release payment to seller
    await EscrowService.releaseToSeller(transactionId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delivery confirmation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm delivery' },
      { status: 500 }
    );
  }
}

