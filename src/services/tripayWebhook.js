// src/services/tripayWebhook.js
import { supabase } from '../lib/supabase';

export const handleTripayWebhook = async (payload) => {
  try {
    console.log('🔔 Tripay Webhook Received:', payload);

    const { reference, status, merchant_ref } = payload;

    if (!reference) {
      throw new Error('Reference tidak ditemukan di payload webhook');
    }

    // Cari order berdasarkan reference
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tripay_reference', reference)
      .single();

    if (error || !order) {
      console.error('Order tidak ditemukan untuk reference:', reference);
      return { success: false, error: 'Order tidak ditemukan' };
    }

    let paymentStatus = 'unpaid';
    let shippingStatus = 'pending';

    // Map Tripay status ke status internal
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

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status_pembayaran: paymentStatus,
        status_pengiriman: shippingStatus,
        updated_at: new Date().toISOString()
      })
      .eq('tripay_reference', reference);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      throw updateError;
    }

    // Jika pembayaran sukses, update stok
    if (status === 'PAID') {
      await updateProductStockAfterPayment(order.id);
    }

    console.log('✅ Webhook processed successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return { success: false, error: error.message };
  }
};

// Fungsi untuk update stok (sama seperti sebelumnya)
const updateProductStockAfterPayment = async (orderId) => {
  // ... kode update stok yang sama
};