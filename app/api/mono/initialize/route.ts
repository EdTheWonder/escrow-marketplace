import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch('https://api.mono.co/v1/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MONO_SECRET_KEY}`
      },
      body: JSON.stringify({
        amount: amount * 100,
        type: "onetime-debit",
        description: "Purchase payment",
        reference: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Payment initialization failed:', data);
      throw new Error(data.message || 'Payment initialization failed');
    }

    return NextResponse.json({
      success: true,
      reference: data.reference || data.id,
      data: data
    });
  } catch (error: any) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment initialization failed' }, 
      { status: 500 }
    );
  }
}
