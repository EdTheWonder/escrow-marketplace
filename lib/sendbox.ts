import { env } from 'process';

const SENDBOX_API = 'https://api.sendbox.co';

export async function calculateSendboxDelivery(params: {
  pickup_location: string;
  delivery_location: string;
  weight: number;
}) {
  const response = await fetch(`${SENDBOX_API}/shipping/calculate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDBOX_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pickup_location: params.pickup_location,
      delivery_location: params.delivery_location,
      weight: params.weight,
      transport_type: 'road'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to calculate delivery price');
  }

  const data = await response.json();
  return {
    amount: data.amount,
    estimatedDays: data.estimated_days
  };
}
