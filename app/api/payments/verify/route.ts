import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { reference } = await request.json();
    
    // Verify payment with Mono
    const response = await fetch('https://api.mono.co/v1/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MONO_TEST_SECRET_KEY}`
      },
      body: JSON.stringify({ reference })
    });

    const data = await response.json();
    
    if (data.status === 'successful') {
      const supabase = createRouteHandlerClient({ cookies });
      
      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status: 'in_escrow' })
        .eq('payment_reference', reference);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

