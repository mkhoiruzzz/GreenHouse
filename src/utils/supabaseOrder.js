// src/utils/supabaseOrders.js
import { supabase } from './supabaseClient';

export const createOrder = async (orderData) => {
  try {
    console.log('🛒 Creating order with data:', orderData);

    // 1. Insert order utama
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: orderData.user_id,
          total_harga: orderData.total_harga,
          biaya_pengiriman: orderData.biaya_pengiriman || 0,
          metode_pembayaran: orderData.metode_pembayaran || 'transfer',
          alamat_pengiriman: orderData.alamat_pengiriman,
          status_pembayaran: 'pending',
          status_pengiriman: 'pending'
        }
      ])
      .select()
      .single();

    if (orderError) {
      console.error('❌ Order creation error:', orderError);
      throw orderError;
    }

    console.log('✅ Order created:', order);

    // 2. Insert order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      harga_satuan: item.harga
    }));

    console.log('📦 Order items to insert:', orderItems);

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('❌ Order items error:', itemsError);
      throw itemsError;
    }

    console.log('✅ Order items created successfully');

    return { 
      success: true, 
      orderId: order.id,
      message: 'Pesanan berhasil dibuat' 
    };

  } catch (error) {
    console.error('❌ Error creating order:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'Gagal membuat pesanan: ' + error.message
    };
  }
};