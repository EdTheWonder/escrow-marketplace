import { confirmDelivery } from '@/lib/delivery';

export async function POST(req: Request) {
  try {
    const { transactionId } = await req.json();
    const result = await confirmDelivery(transactionId);
    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ error: 'Delivery confirmation failed' }, { status: 500 });
  }
}

