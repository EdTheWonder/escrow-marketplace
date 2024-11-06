import { supabase } from "./supabase";

export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function initializePayment(amount: number, email: string) {
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to kobo
        email,
        currency: 'NGN',
      })
    });

    const data = await response.json();
    if (!data.status) throw new Error('Failed to initialize payment');
    
    return data.data;
  } catch (error) {
    throw error;
  }
}

export async function verifyPayment(reference: string) {
  try {
    console.log('Verifying payment:', reference);
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const data = await response.json();
    console.log('Paystack verification response:', data);

    if (data.status && data.data.status === 'success') 

    return data;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
}

