import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';
import { EscrowService } from '@/lib/escrow';
import { WalletManager } from '@/lib/wallet';

export async function POST(request: Request) {
  try {
    const { reference } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    const verification = await verifyPayment(reference);
    console.log('Paystack verification response:', verification);
    
    if (verification.data.status === 'success') {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*, products(*)')
        .eq('payment_reference', reference)
        .single();

      if (!transaction) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }

      // First create the escrow wallet
      await EscrowService.createEscrowWallet(transaction.id, transaction.amount);

      // Then hold the payment in escrow
      await WalletManager.holdEscrow(transaction.id, transaction.amount);

      // Finally update the statuses
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: 'in_escrow',
          payment_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          payment_reference: reference,
          payment_status: 'success'
        })
        .eq('id', transaction.id);

      if (updateError) throw updateError;
      
      return NextResponse.json({ 
        status: 'success',
        transaction 
      });
    }

    return NextResponse.json(
      { error: 'Payment verification failed with Paystack' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
