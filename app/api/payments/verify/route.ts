import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { reference } = await request.json();
    
    const verification = await verifyPayment(reference);
    
    if (verification.data.status === 'success') {
      // Get transaction and update statuses atomically
      const { data: result, error } = await supabase
        .rpc('process_successful_payment', {
          p_reference: reference
        });

      if (error) throw error;

      return NextResponse.json({ status: 'success', transaction: result });
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
