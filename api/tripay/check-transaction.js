import axios from 'axios';
import { createClient } from "@supabase/supabase-js";

const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY || process.env.VITE_TRIPAY_API_KEY;
const TRIPAY_MODE = process.env.TRIPAY_MODE || process.env.VITE_TRIPAY_MODE || 'sandbox';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

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

    // 1. Check local database first (using Service Role to bypass RLS)
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: order, error: dbError } = await supabase
          .from('orders')
          .select('status_pembayaran, status_pengiriman')
          .eq('tripay_reference', reference)
          .single();

        if (!dbError && order) {
          const dbStatus = order.status_pembayaran?.toUpperCase();
          const shipStatus = order.status_pengiriman?.toUpperCase();

          // If already marked as PAID or LUNAS (or even SHIPPED/DELIVERED which implies paid)
          if (dbStatus === 'PAID' || dbStatus === 'LUNAS' || shipStatus === 'DELIVERED' || shipStatus === 'SHIPPED') {
            console.log('✅ Found PAID/LUNAS status in Database');
            return res.status(200).json({
              success: true,
              data: {
                status: 'PAID', // Map our internal status to PAID for frontend consistency
                reference: reference,
                is_manual: true
              }
            });
          }
        }
      } catch (supabaseErr) {
        console.warn('⚠️ Supabase check failed, falling back to Tripay:', supabaseErr.message);
      }
    }

    // 2. Fallback to Tripay API
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

    console.log('✅ Tripay API status:', response.data.data?.status);

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