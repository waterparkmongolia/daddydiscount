import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const username = process.env.QPAY_USERNAME;
  const password = process.env.QPAY_PASSWORD;
  const invoiceCode = process.env.QPAY_INVOICE_CODE;

  if (!username || !password) {
    return res.status(500).json({ error: 'Credentials not set', username: !!username, password: !!password });
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  // Step 1: Get token
  let token: string;
  let tokenResponse: any;
  try {
    const response = await axios.post(
      'https://merchant.qpay.mn/v2/auth/token',
      {},
      { headers: { Authorization: `Basic ${auth}` } }
    );
    tokenResponse = response.data;
    token = response.data.access_token;
  } catch (error: any) {
    return res.status(500).json({
      step: 'auth',
      error: error.response?.data || error.message,
      status: error.response?.status,
    });
  }

  // Step 2: Try creating a minimal invoice
  try {
    const invoiceData = {
      invoice_code: invoiceCode,
      sender_invoice_no: `TEST${Date.now()}`.substring(0, 20),
      invoice_receiver_code: username,
      invoice_description: 'Test',
      amount: 1,
      callback_url: 'https://discounter-phi-nine.vercel.app/api/qpay/callback',
    };

    const invoiceResponse = await axios.post(
      'https://merchant.qpay.mn/v2/invoice',
      invoiceData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res.json({
      auth: 'OK',
      tokenType: tokenResponse.token_type,
      invoice: 'OK',
      invoiceId: invoiceResponse.data.invoice_id,
    });
  } catch (error: any) {
    return res.status(500).json({
      auth: 'OK',
      step: 'invoice',
      invoiceCode,
      receiverCode: username,
      error: error.response?.data || error.message,
      status: error.response?.status,
    });
  }
}
