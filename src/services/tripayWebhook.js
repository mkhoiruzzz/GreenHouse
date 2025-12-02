// src/services/tripayWebhook.js
import { supabase } from '../lib/supabase';

export const handleTripayWebhook = async (payload) => {
  try {
    console.log('🔔 Tripay Webhook Processing:', {
      reference: payload.reference,
      status: payload.status,
      merchant_ref: payload.merchant_ref
    });

    const { reference, status, merchant_ref, amount, paid_at } = payload;

    if (!reference) {
      throw new Error('Reference tidak ditemukan di payload webhook');
    }

    // 1. Cari order berdasarkan reference
    console.log('🔍 Searching order with reference:', reference);
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('tripay_reference', reference)
      .single();

    if (fetchError || !order) {
      console.error('❌ Order tidak ditemukan untuk reference:', reference);
      
      // Coba cari dengan merchant_ref jika reference tidak ditemukan
      if (merchant_ref) {
        console.log('🔍 Trying to find order with merchant_ref:', merchant_ref);
        const { data: orderByMerchantRef } = await supabase
          .from('orders')
          .select('*')
          .eq('id', merchant_ref.split('-')[1]) // Format: ORDER-{id}-{timestamp}
          .single();
          
        if (orderByMerchantRef) {
          console.log('✅ Found order by merchant_ref:', orderByMerchantRef.id);
          // Update reference jika belum ada
          await supabase
            .from('orders')
            .update({ tripay_reference: reference })
            .eq('id', orderByMerchantRef.id);
        }
      }
      
      throw new Error(`Order tidak ditemukan untuk reference: ${reference}`);
    }

    console.log('✅ Order found:', order.id);

    // 2. Map Tripay status ke status internal
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
      case 'UNPAID':
        paymentStatus = 'unpaid';
        break;
      case 'REFUND':
        paymentStatus = 'refunded';
        break;
      default:
        console.warn('⚠️ Unknown status:', status);
        paymentStatus = 'unpaid';
    }

    // 3. Data update
    const updateData = {
      status_pembayaran: paymentStatus,
      status_pengiriman: shippingStatus,
      updated_at: new Date().toISOString()
    };

    // Tambahkan paid_at jika tersedia
    if (paid_at && status === 'PAID') {
      updateData.paid_at = paid_at;
    }

    console.log('🔄 Updating order:', {
      orderId: order.id,
      reference: reference,
      from: order.status_pembayaran,
      to: paymentStatus
    });

    // 4. Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('tripay_reference', reference);

    if (updateError) {
      console.error('❌ Error updating order status:', updateError);
      throw updateError;
    }

    console.log('✅ Order updated successfully');

    // 5. Jika pembayaran sukses, update stok
    if (status === 'PAID') {
      await updateProductStockAfterPayment(order.id);
    }

    // 6. Log ke tabel webhook_logs untuk audit
    try {
      await supabase.from('webhook_logs').insert({
        order_id: order.id,
        reference: reference,
        status: status,
        payload: JSON.stringify(payload),
        processed_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('⚠️ Failed to log webhook:', logError);
      // Jangan throw error hanya untuk logging
    }

    console.log('🎉 Webhook processed completely');
    return { success: true, orderId: order.id, status: paymentStatus };

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    
    // Log error untuk debugging
    try {
      await supabase.from('webhook_errors').insert({
        reference: payload?.reference,
        error_message: error.message,
        payload: JSON.stringify(payload),
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('❌ Failed to log error:', logError);
    }
    
    return { success: false, error: error.message };
  }
};

// Fungsi untuk update stok setelah pembayaran sukses
const updateProductStockAfterPayment = async (orderId) => {
  try {
    console.log('📦 Updating product stock for order:', orderId);
    
    // Ambil semua item dari order
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (error) {
      console.error('❌ Error fetching order items:', error);
      return;
    }

    console.log(`🔄 Processing ${orderItems?.length || 0} items`);

    // Update stok untuk setiap produk
    for (const item of orderItems || []) {
      // 1. Dapatkan stok saat ini
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stok, nama_produk')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        console.error(`❌ Product not found: ${item.product_id}`);
        continue;
      }

      // 2. Hitung stok baru
      const newStock = Math.max(0, product.stok - item.quantity);

      // 3. Update stok
      const { error: updateError } = await supabase
        .from('products')
        .update({ stok: newStock })
        .eq('id', item.product_id);

      if (updateError) {
        console.error(`❌ Error updating stock for product ${item.product_id}:`, updateError);
      } else {
        console.log(`✅ Stock updated: ${product.nama_produk} (${product.stok} → ${newStock})`);
      }
    }

    console.log('✅ Product stock updated successfully');
  } catch (error) {
    console.error('❌ Error in updateProductStockAfterPayment:', error);
    throw error;
  }
};