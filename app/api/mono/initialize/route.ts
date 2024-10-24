import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();
    
    const response = await fetch('https://api.mono.co/v1/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MONO_SECRET_KEY}`
      },
      body: JSON.stringify({
        amount: amount * 100,
        type: "onetime-debit",
        description: "Purchase payment",
        reference: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
  }
}

