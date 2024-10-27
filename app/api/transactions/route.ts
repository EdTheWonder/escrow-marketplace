import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EscrowService } from '@/lib/escrow';

export async function POST(request: Request) {
  try {
    const { productId, amount, paymentReference } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get product details
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        product_id: productId,
        buyer_id: user.id,
        seller_id: product.seller_id,
        amount,
        status: 'pending',
        payment_reference: paymentReference
      })
      .select()
      .single();

    if (transactionError) throw transactionError;
    // Create escrow wallet
    await EscrowService.createEscrowWallet(transaction.id, amount);

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    console.error('Transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Transaction failed' },
      { status: 500 }
    );
  }
}
