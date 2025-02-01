import { NextResponse } from 'next/server';
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
  try {
    const { reference, transactionId } = await request.json();
    
    // Verify payment with Paystack first
    const paymentValid = await verifyPaystackPayment(reference);
    if (!paymentValid) {
      throw new Error('Payment verification failed');
    }

    // Update transaction and product status
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

