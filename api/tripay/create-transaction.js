// api/tripay/create-transaction.js - FIXED VERSION
import axios from 'axios';
import crypto from 'crypto';

// ✅ FIX: Hapus prefix VITE_ untuk API routes
const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY;
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY;
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE;
const TRIPAY_MODE = process.env.TRIPAY_MODE || 'sandbox';

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

    console.log('📦 Creating Tripay transaction:', {
      method, 
      merchant_ref, 
      amount, 
      customer_name,
      mode: TRIPAY_MODE,
      api_url: TRIPAY_API_URL
    });

    // ✅ Validasi input
    if (!method || !amount || !customer_name || !customer_email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: method, amount, customer_name, customer_email'
      });
    }

    // ✅ Validasi environment variables
    if (!TRIPAY_API_KEY || !TRIPAY_PRIVATE_KEY || !TRIPAY_MERCHANT_CODE) {
      console.error('❌ Missing Tripay credentials. Please check environment variables:');
      console.error({
        TRIPAY_API_KEY: TRIPAY_API_KEY ? '✓ Set' : '✗ Missing',
        TRIPAY_PRIVATE_KEY: TRIPAY_PRIVATE_KEY ? '✓ Set' : '✗ Missing',
        TRIPAY_MERCHANT_CODE: TRIPAY_MERCHANT_CODE ? '✓ Set' : '✗ Missing'
      });
      
      return res.status(500).json({
        success: false,
        error: 'Tripay configuration missing. Please contact administrator.'
      });
    }

    // ✅ Generate signature (Format: MERCHANT_CODE + MERCHANT_REF + AMOUNT)
    const signatureString = TRIPAY_MERCHANT_CODE + merchant_ref + amount;
    const signature = crypto
      .createHmac('sha256', TRIPAY_PRIVATE_KEY)
      .update(signatureString)
      .digest('hex');

    console.log('🔐 Signature generated');

    // ✅ Prepare payload
    const payload = {
      method,
      merchant_ref,
      amount: parseInt(amount),
      customer_name,
      customer_email,
      customer_phone: customer_phone || '',
      order_items: order_items || [],
      return_url: return_url || `${process.env.VERCEL_URL || 'http://localhost:3000'}/checkout`,
      expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 jam
      signature
    };

    console.log('💰 Sending to Tripay API:', {
      url: `${TRIPAY_API_URL}/transaction/create`,
      method: payload.method,
      amount: payload.amount,
      signature: '***hidden***'
    });

    // ✅ Call Tripay API
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

    console.log('✅ Tripay API Response Status:', response.status);

    if (response.data.success) {
      console.log('🎉 Transaction created successfully:', {
        reference: response.data.data.reference,
        checkout_url: response.data.data.checkout_url,
        status: response.data.data.status
      });
      
      return res.status(200).json({
        success: true,
        data: response.data.data
      });
    } else {
      console.error('❌ Tripay returned success: false', response.data);
      throw new Error(response.data.message || 'Tripay API error');
    }

  } catch (error) {
    console.error('❌ Error creating Tripay transaction:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    
    // ✅ Better error handling
    let errorMessage = 'Gagal membuat transaksi pembayaran';
    let errorDetails = error.message;
    
    if (error.response?.data) {
      errorMessage = error.response.data.message || errorMessage;
      errorDetails = JSON.stringify(error.response.data);
    }
    
    return res.status(error.response?.status || 500).json({
      success: false,
      error: errorDetails,
      message: errorMessage
    });
  }
}