import axios from 'axios';

const TRIPAY_API_KEY = process.env.VITE_TRIPAY_API_KEY;
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'Reference is required'
      });
    }

    console.log('🔍 Checking transaction status:', reference);

    const response = await axios.get(
      `${TRIPAY_API_URL}/transaction/detail?reference=${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${TRIPAY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Transaction status:', response.data.data?.status);

    return res.status(200).json({
      success: true,
      data: response.data.data
    });

  } catch (error) {
    console.error('❌ Error checking transaction:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Gagal memeriksa status transaksi'
    });
  }
}