import axios from 'axios';
import crypto from 'crypto';

const TRIPAY_API_KEY = process.env.VITE_TRIPAY_API_KEY;
const TRIPAY_PRIVATE_KEY = process.env.VITE_TRIPAY_PRIVATE_KEY;
const TRIPAY_MERCHANT_CODE = process.env.VITE_TRIPAY_MERCHANT_CODE;
const TRIPAY_MODE = process.env.VITE_TRIPAY_MODE || 'sandbox';

const TRIPAY_API_URL = TRIPAY_MODE === 'production' 
  ? 'https://tripay.co.id/api' 
  : 'https://tripay.co.id/api-sandbox';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      method,
      merchant_ref,
      amount,
      customer_name,
      customer_email,
      customer_phone,
      order_items,
      return_url
    } = req.body;

    console.log('📦 Received transaction data:', {
      method, merchant_ref, amount, customer_name, customer_email
    });

    // Validasi input
    if (!method || !amount || !customer_name || !customer_email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validasi environment variables
    if (!TRIPAY_API_KEY || !TRIPAY_PRIVATE_KEY || !TRIPAY_MERCHANT_CODE) {
      console.error('❌ Missing Tripay environment variables');
      return res.status(500).json({
        success: false,
        error: 'Tripay configuration missing'
      });
    }

    // Generate signature (WAJIB untuk Tripay)
    const signature = crypto
      .createHmac('sha256', TRIPAY_PRIVATE_KEY)
      .update(TRIPAY_MERCHANT_CODE + merchant_ref + amount)
      .digest('hex');

    console.log('🔐 Generated signature:', signature);

    const payload = {
      method,
      merchant_ref,
      amount: parseInt(amount),
      customer_name,
      customer_email,
      customer_phone: customer_phone || '',
      order_items: order_items || [],
      return_url: return_url || `https://green-house-mkhoiruzzzs-projects.vercel.app/checkout`,
      expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 jam
      signature
    };

    console.log('💰 Sending to Tripay API:', {
      url: `${TRIPAY_API_URL}/transaction/create`,
      payload: { ...payload, signature: '***hidden***' } // Hide signature in logs
    });

    const response = await axios.post(
      `${TRIPAY_API_URL}/transaction/create`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${TRIPAY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('✅ Tripay API Response:', response.data);

    if (response.data.success) {
      console.log('🎉 Transaction created in Tripay:', response.data.data.reference);
      return res.status(200).json({
        success: true,
        data: response.data.data
      });
    } else {
      throw new Error(response.data.message || 'Tripay API error');
    }

  } catch (error) {
    console.error('❌ Error creating Tripay transaction:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Gagal membuat transaksi di Tripay'
    });
  }
}