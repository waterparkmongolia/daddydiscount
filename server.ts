import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Fix for MaxListenersExceededWarning
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 30;

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// QPay Token Caching
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// QPay Integration Logic
async function getQPayToken() {
  const username = process.env.QPAY_USERNAME;
  const password = process.env.QPAY_PASSWORD;

  if (!username || !password) {
    throw new Error('QPAY_USERNAME and QPAY_PASSWORD are required');
  }

  // Use cached token if valid (buffer of 60 seconds)
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  
  try {
    const response = await axios.post('https://merchant.qpay.mn/v2/auth/token', {}, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    cachedToken = response.data.access_token;
    // QPay tokens usually expire in 24 hours (86400s), but let's be safe
    const expiresIn = response.data.expires_in || 3600; 
    tokenExpiry = Date.now() + (expiresIn * 1000);
    
    return cachedToken;
  } catch (error: any) {
    console.error('QPay Auth Error:', error.response?.data || error.message);
    throw new Error('Failed to get QPay token');
  }
}

app.post('/api/qpay/create-invoice', async (req, res) => {
  try {
    const { amount, description } = req.body;
    const token = await getQPayToken();

    const invoiceData = {
      invoice_code: process.env.QPAY_INVOICE_CODE || "TEST_INVOICE",
      sender_invoice_no: `INV${Date.now()}`.substring(0, 20),
      invoice_receiver_code: "TERMINAL",
      invoice_description: description || "Daddy Discounter Support",
      amount: Number(amount),
      callback_url: `${req.protocol}://${req.get('host')}/api/qpay/callback`
    };

    const response = await axios.post('https://merchant.qpay.mn/v2/invoice', invoiceData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    res.json(response.data);
  } catch (error: any) {
    const errorDetails = error.response?.data || error.message;
    console.error('QPay Invoice Error:', errorDetails);
    res.status(500).json({ 
      error: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails 
    });
  }
});

app.get('/api/qpay/check-payment/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const token = await getQPayToken();

    const response = await axios.post('https://merchant.qpay.mn/v2/payment/check', {
      object_type: "INVOICE",
      object_id: invoiceId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite Middleware for Dev/Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
