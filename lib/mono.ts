const MONO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MONO_TEST_PUBLIC_KEY!;
const MONO_SECRET_KEY = process.env.NEXT_PUBLIC_MONO_TEST_SECRET_KEY!;

export async function initializePayment(amount: number) {
  try {
    const response = await fetch('https://api.mono.co/v1/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MONO_PUBLIC_KEY}`
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to kobo/cents
        type: "onetime-debit",
        description: "Purchase payment",
        reference: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      })
    });

    const data = await response.json();
    if (!data.id) throw new Error('Failed to initialize payment');
    
    return data;
  } catch (error) {
    throw error;
  }
}

export async function verifyPayment(reference: string) {
  try {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference })
    });

    const data = await response.json();
    if (!data.success) throw new Error('Payment verification failed');
    
    return data;
  } catch (error) {
    throw error;
  }
}

