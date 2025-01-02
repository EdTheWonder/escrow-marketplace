import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EscrowService } from '@/lib/escrow';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { transactionId, userId } = await request.json();
    console.log('Processing delivery confirmation for transaction:', transactionId);
    
    // Get transaction details first
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('buyer_id', userId)
      .single();

    if (txError || !transaction) {
      console.error('Transaction not found or unauthorized:', txError);
      return NextResponse.json({ error: 'Transaction not found or unauthorized' }, { status: 404 });
    }

    // Release payment to seller through EscrowService
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

