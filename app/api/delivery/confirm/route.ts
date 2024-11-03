import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { confirmDelivery } from '@/lib/delivery';

export async function POST(request: Request) {
  try {
    const { transactionId } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Get transaction details with escrow wallet
    const { data: transaction } = await supabase
      .from('transactions')
      .select(`
        *,
        products(*),
        sellers:seller_id(wallet_balance),
        escrow_wallets!left(*)
      `)
      .eq('id', transactionId)
      .single();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (!transaction.escrow_wallets) {
      return NextResponse.json(
        { error: 'No escrow wallet found for this transaction' },
        { status: 400 }
      );
    }

    await confirmDelivery(transactionId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delivery confirmation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm delivery' },
      { status: 500 }
    );
  }
}

