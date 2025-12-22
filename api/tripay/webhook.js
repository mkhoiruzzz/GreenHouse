// api/tripay/webhook.js
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const TRIPAY_CALLBACK_KEY = process.env.TRIPAY_CALLBACK_KEY || process.env.TRIPAY_PRIVATE_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  // Timeout protection
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.error('⏱️ Request timeout');
      res.status(504).json({ error: 'Request timeout' });
    }
  }, 8000);

  try {
    // CORS
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

    console.log('📩 Tripay Webhook Received');
    
    const signature = req.headers['x-callback-signature'];
    const payload = req.body;
    
    // Validasi signature
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
    console.log('📦 Payload:', {
      reference: payload.reference,
      merchant_ref: payload.merchant_ref,
      status: payload.status,
      amount: payload.total_amount
    });

    // ✅ RESPONSE IMMEDIATELY
    clearTimeout(timeoutId);
    res.status(200).json({ success: true, message: 'Webhook received' });

    // ✅ PROCESS ASYNC AFTER RESPONSE
    setImmediate(async () => {
      try {
        await processWebhook(payload);
      } catch (error) {
        console.error('❌ Background process error:', error);
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

// ✅ Process webhook logic
async function processWebhook(payload) {
  try {
    const { reference, status, merchant_ref, paid_at } = payload;
    
    console.log('🔄 Processing webhook for:', reference);

    // 1. Find order
    let { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('tripay_reference', reference)
      .single();

    // Try merchant_ref if not found
    if (fetchError || !order) {
      console.log('🔍 Trying merchant_ref:', merchant_ref);
      const orderId = merchant_ref?.split('-')[1];
      if (orderId) {
        const result = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        
        if (result.data) {
          order = result.data;
          // Update reference
          await supabase
            .from('orders')
            .update({ tripay_reference: reference })
            .eq('id', orderId);
        }
      }
    }

    if (!order) {
      console.error('❌ Order not found:', reference);
      return;
    }

    console.log('✅ Order found:', order.id);

    // 2. Map status
    let paymentStatus = 'unpaid';
    let shippingStatus = order.status_pengiriman || 'pending';

    switch (status) {
      case 'PAID':
        paymentStatus = 'paid';
        shippingStatus = 'processing';
        break;
      case 'EXPIRED':
        paymentStatus = 'expired';
        break;
      case 'FAILED':
        paymentStatus = 'failed';
        break;
      case 'REFUND':
        paymentStatus = 'refunded';
        break;
      default:
        paymentStatus = 'unpaid';
    }

    // 3. Update order
    const updateData = {
      status_pembayaran: paymentStatus,
      status_pengiriman: shippingStatus,
      updated_at: new Date().toISOString()
    };

    if (paid_at && status === 'PAID') {
      updateData.paid_at = paid_at;
    }

    console.log('📝 Updating order:', order.id);
    
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw updateError;
    }

    console.log('✅ Order updated');

    // 4. Reduce stock if PAID (first time)
    if (status === 'PAID' && order.status_pembayaran !== 'paid') {
      console.log('📦 Reducing stock...');
      await reduceProductStock(order.id);
    }

    // 5. Log webhook
    try {
      await supabase.from('webhook_logs').insert({
        order_id: order.id,
        reference: reference,
        status: status,
        payload: JSON.stringify(payload),
        processed_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('⚠️ Log failed:', logError);
    }

    console.log('🎉 Webhook processed successfully');

  } catch (error) {
    console.error('❌ Process error:', error);
    
    // Log error
    try {
      await supabase.from('webhook_errors').insert({
        reference: payload?.reference,
        error_message: error.message,
        payload: JSON.stringify(payload),
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('❌ Error log failed:', e);
    }
  }
}

// ✅ Reduce stock function
async function reduceProductStock(orderId) {
  try {
    // Get order items
    const { data: items, error } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (error || !items?.length) {
      console.warn('⚠️ No items found');
      return;
    }

    console.log(`📦 Updating ${items.length} products`);

    // Update each product stock
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stok, nama_produk')
        .eq('id', item.product_id)
        .single();

      if (!product) continue;

      const newStock = Math.max(0, product.stok - item.quantity);

      await supabase
        .from('products')
        .update({ stok: newStock })
        .eq('id', item.product_id);

      console.log(`✅ ${product.nama_produk}: ${product.stok} → ${newStock}`);
    }

  } catch (error) {
    console.error('❌ Stock update error:', error);
    throw error;
  }
}