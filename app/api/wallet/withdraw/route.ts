import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's wallet balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', user.id)
      .single();

    if (!profile || profile.wallet_balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create withdrawal transaction
    const { error: withdrawalError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: user.id,
        type: 'withdrawal',
        amount: amount,
        status: 'pending',
        metadata: {
          withdrawal_type: 'bank_transfer'
        }
      });

    if (withdrawalError) throw withdrawalError;

    // Update wallet balance
    await supabase.rpc('update_wallet_balance', {
      p_user_id: user.id,
      p_amount: -amount
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
