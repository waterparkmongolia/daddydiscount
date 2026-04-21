import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getQPayToken(): Promise<string> {
  const username = process.env.QPAY_USERNAME;
  const password = process.env.QPAY_PASSWORD;

  if (!username || !password) {
    throw new Error('QPAY credentials are not configured');
  }

  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  const response = await axios.post(
    'https://merchant.qpay.mn/v2/auth/token',
    {},
    { headers: { Authorization: `Basic ${auth}` } }
  );

  cachedToken = response.data.access_token;
  const expiresIn = response.data.expires_in || 3600;
  tokenExpiry = Date.now() + expiresIn * 1000;

  return cachedToken!;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceId } = req.query;

  if (!invoiceId || typeof invoiceId !== 'string') {
    return res.status(400).json({ error: 'invoiceId is required' });
  }

  try {
    const token = await getQPayToken();

    const response = await axios.post(
      'https://merchant.qpay.mn/v2/payment/check',
      { object_type: 'INVOICE', object_id: invoiceId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(response.data);
  } catch (error: any) {
    const errorDetails = error.response?.data || error.message;
    console.error('QPay Check Payment Error:', errorDetails);
    res.status(500).json({ error: error.message });
  }
}
