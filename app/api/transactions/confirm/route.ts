import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { WalletManager } from '@/lib/wallet';

export async function POST(request: Request) {
  try {
    const { transactionId } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Get transaction details
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*, products(*)')
      .eq('id', transactionId)
      .single();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Release escrow to seller
    await WalletManager.releaseEscrow(transactionId);

    // Update product status
    await supabase
      .from('products')
      .update({ status: 'sold' })
      .eq('id', transaction.product_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transaction confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

