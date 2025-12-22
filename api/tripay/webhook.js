// api/tripay/webhook.js
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const TRIPAY_CALLBACK_KEY = process.env.TRIPAY_CALLBACK_KEY || process.env.TRIPAY_PRIVATE_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.error('⏱️ Request timeout');
      res.status(504).json({ error: 'Request timeout' });
    }
  }, 8000);

  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Callback-Signature');

    if (req.method === 'OPTIONS') {
      clearTimeout(timeoutId);
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      clearTimeout(timeoutId);
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    console.log('📩 Webhook received');
    
    const signature = req.headers['x-callback-signature'];
    const payload = req.body;
    
    if (!signature) {
      console.error('❌ No signature');
      clearTimeout(timeoutId);
      return res.status(400).json({ success: false, error: 'No signature' });
    }

    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', TRIPAY_CALLBACK_KEY)
      .update(payloadString)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid signature');
      clearTimeout(timeoutId);
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    console.log('✅ Signature valid');

    clearTimeout(timeoutId);
    res.status(200).json({ success: true, message: 'Webhook received' });

    setImmediate(async () => {
      try {
        await processWebhook(payload);
      } catch (error) {
        console.error('❌ Background error:', error);
      }
    });

  } catch (error) {
    console.error('❌ Handler error:', error);
    clearTimeout(timeoutId);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

async function processWebhook(payload) {
  try {
    const { reference, status, merchant_ref, paid_at } = payload;
    console.log('🔄 Processing:', reference);

    let { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('tripay_reference', reference)
      .single();

    if (!order && merchant_ref) {
      const orderId = merchant_ref?.split('-')[1];
      if (orderId) {
        const result = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        
        if (result.data) {
          order = result.data;
          await supabase
            .from('orders')
            .update({ tripay_reference: reference })
            .eq('id', orderId);
        }
      }
    }

    if (!order) {
      console.error('❌ Order not found');
      return;
    }

    console.log('✅ Order found:', order.id);

    let paymentStatus = 'unpaid';
    let shippingStatus = order.status_pengiriman || 'pending';

    if (status === 'PAID') {
      paymentStatus = 'paid';
      shippingStatus = 'processing';
    } else if (status === 'EXPIRED') {
      paymentStatus = 'expired';
    } else if (status === 'FAILED') {
      paymentStatus = 'failed';
    } else if (status === 'REFUND') {
      paymentStatus = 'refunded';
    }

    const updateData = {
      status_pembayaran: paymentStatus,
      status_pengiriman: shippingStatus,
      updated_at: new Date().toISOString()
    };

    if (paid_at && status === 'PAID') {
      updateData.paid_at = paid_at;
    }

    await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    console.log('✅ Order updated');

    if (status === 'PAID' && order.status_pembayaran !== 'paid') {
      console.log('📦 Reducing stock...');
      await reduceStock(order.id);
      
      try {
        console.log('📱 Sending WhatsApp...');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('uuid', order.user_id)
          .single();
        
        console.log('Profile:', profile);
        
        if (profile?.phone) {
          let phone = profile.phone.replace(/^0/, '62').replace(/\D/g, '');
          console.log('Sending to:', phone);
          
          const msg = `🎉 *Pembayaran Berhasil!*

Halo *${profile.full_name || 'Customer'}*,

Pembayaran telah diterima!

📋 *Detail:*
• Order: ${order.id}
• Total: Rp ${order.total_harga?.toLocaleString('id-ID')}
• Status: ✅ Lunas

📦 Pesanan sedang diproses.

Terima kasih! 🌱

_Pesan otomatis_`;
          
          await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
              'Authorization': FONNTE_TOKEN,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              target: phone,
              message: msg,
              countryCode: '62'
            })
          });
          
          console.log('✅ WhatsApp sent');
        }
      } catch (err) {
        console.error('❌ WhatsApp failed:', err);
      }
    }

    console.log('🎉 Done');

  } catch (error) {
    console.error('❌ Process error:', error);
  }
}

async function reduceStock(orderId) {
  try {
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (!items?.length) return;

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stok')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({ stok: Math.max(0, product.stok - item.quantity) })
          .eq('id', item.product_id);
      }
    }

    console.log('✅ Stock updated');
  } catch (error) {
    console.error('❌ Stock error:', error);
  }
}