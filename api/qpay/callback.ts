import type { VercelRequest, VercelResponse } from '@vercel/node';

// QPay calls this endpoint when a payment is completed.
// The frontend polls /api/qpay/check-payment/:invoiceId every 3s,
// so this handler just needs to acknowledge receipt.
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('QPay callback received:', JSON.stringify(req.body));

  // QPay expects a 200 OK to confirm receipt
  res.status(200).json({ status: 'received' });
}
