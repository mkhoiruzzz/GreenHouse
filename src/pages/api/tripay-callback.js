// pages/api/tripay-callback.js
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔔 Tripay Callback Received:', req.body);

    const { 
      reference, 
      merchant_ref, 
      status, 
      amount,
      paid_at,
      payment_method,
      customer_name,
      customer_email
    } = req.body;

    // Validasi signature (penting untuk keamanan)
    const isValid = await validateSignature(req.body);
    if (!isValid) {
      console.error('❌ Invalid signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Cari order berdasarkan reference
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tripay_reference', reference)
      .single();

    if (error || !order) {
      console.error('❌ Order not found for reference:', reference);
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('📦 Order found:', order.id);

    // Map status Tripay ke status internal
    let paymentStatus = 'unpaid';
    let shippingStatus = 'pending';

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
      case 'UNPAID':
        paymentStatus = 'unpaid';
        break;
      default:
        paymentStatus = 'unpaid';
    }

    // Update order di database
    const updateData = {
      status_pembayaran: paymentStatus,
      status_pengiriman: shippingStatus,
      updated_at: new Date().toISOString()
    };

    // Jika pembayaran sukses, tambah data paid_at
    if (status === 'PAID' && paid_at) {
      updateData.paid_at = new Date(paid_at * 1000).toISOString();
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('tripay_reference', reference);

    if (updateError) {
      console.error('❌ Error updating order:', updateError);
      throw updateError;
    }

    // Jika pembayaran sukses, update stok produk
    if (status === 'PAID') {
      await updateProductStockAfterPayment(order.id);
      console.log('✅ Stock updated after successful payment');
    }

    console.log('✅ Callback processed successfully');
    
    // Beri response success ke Tripay
    return res.status(200).json({ 
      success: true,
      message: 'Callback processed successfully'
    });

  } catch (error) {
    console.error('❌ Error processing callback:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

// Fungsi validasi signature (penting untuk keamanan)
async function validateSignature(payload) {
  const crypto = require('crypto');
  
  const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY;
  const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE;

  const signature = crypto.createHmac('sha256', TRIPAY_PRIVATE_KEY)
    .update(TRIPAY_MERCHANT_CODE + payload.merchant_ref + payload.amount)
    .digest('hex');

  return signature === payload.signature;
}

// Fungsi update stok produk
async function updateProductStockAfterPayment(orderId) {
  try {
    console.log('🔄 Updating stock for order:', orderId);

    // Ambil items dari order
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (error) {
      console.error('Error fetching order items:', error);
      return false;
    }

    // Update stok untuk setiap produk
    for (const item of orderItems) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stok, nama_produk')
        .eq('id', item.product_id)
        .single();

      if (productError) {
        console.error(`Error fetching product ${item.product_id}:`, productError);
        continue;
      }

      const newStock = (product.stok || 0) - item.quantity;
      
      if (newStock < 0) {
        console.warn(`Insufficient stock for product ${item.product_id}`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stok: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product_id);

      if (updateError) {
        console.error(`Error updating stock for product ${item.product_id}:`, updateError);
      } else {
        console.log(`✅ Stock updated: ${product.nama_produk} (${product.stok} → ${newStock})`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error in updateProductStockAfterPayment:', error);
    return false;
  }
}