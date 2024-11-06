import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';
import { handleSuccessfulPayment } from '@/lib/transactions';

export async function POST(request: Request) {
  try {
    const { reference, transactionId, productId } = await request.json();
    
    // Verify payment with Paystack
    const paymentValid = await verifyPayment(reference);
    if (!paymentValid) {
      throw new Error('Payment verification failed');
    }

    // Update all statuses
    await handleSuccessfulPayment(transactionId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
