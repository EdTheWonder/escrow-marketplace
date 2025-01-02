import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { handlePaymentVerification } from '@/lib/transactions';

async function verifyPaystackPayment(reference: string) {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const data = await response.json();
  
  if (!response.ok || !data.status || data.data.status !== 'success') {
    throw new Error('Payment verification failed');
  }

  return true;
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { reference, transactionId } = await request.json();
    
    // First check if payment was already processed
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('reference', reference)
      .single();

    if (existingPayment) {
      // If payment exists and was successful, continue with escrow
      if (existingPayment.status === 'success') {
        await handlePaymentVerification(transactionId);
      }
      return NextResponse.json({ success: true });
    }

    // Verify payment with Paystack
    const paymentValid = await verifyPaystackPayment(reference);
    if (!paymentValid) {
      throw new Error('Payment verification failed');
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        reference,
        transaction_id: transactionId,
        status: 'success',
        provider: 'paystack'
      });

    if (paymentError) throw paymentError;

    // Start escrow process
    await handlePaymentVerification(transactionId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}

