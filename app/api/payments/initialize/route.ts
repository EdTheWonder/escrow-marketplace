import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const MONO_SECRET_KEY = process.env.MONO_SECRET_KEY!;

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate a unique reference
    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize payment with Mono
    const response = await fetch('https://api.mono.co/v1/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MONO_SECRET_KEY}`
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to cents
        reference,
        description: 'Product purchase',
        type: 'onetime-debit',
        currency: 'USD'
      })
    });

    const data = await response.json();
    return NextResponse.json({
      success: true,
      reference: reference,
      paymentLink: data.payment_link
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    );
  }
}

