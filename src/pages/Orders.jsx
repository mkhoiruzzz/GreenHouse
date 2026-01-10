// src/pages/Orders.jsx - FIXED DARK MODE + CANCEL ORDER (1 DAY LIMIT)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../lib/supabase';

const Orders = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);



  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      if (!user || !user.id) {
        toast.error('User tidak valid');
        return;
      }

      console.log('🔄 Fetching orders for user:', user.id);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Error fetching orders:', ordersError);
        toast.error('Gagal memuat pesanan: ' + ordersError.message);
        setOrders([]);
        return;
      }

      console.log('✅ Orders fetched:', ordersData);

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          if (itemsError) {
            console.error(`❌ Error fetching items for order ${order.id}:`, itemsError);
            return { ...order, order_items: [] };
          }

          const itemsWithProducts = await Promise.all(
            (itemsData || []).map(async (item) => {
              try {
                const { data: productData, error: productError } = await supabase
                  .from('products')
                  .select('nama_produk, gambar_url, icon')
                  .eq('id', item.product_id)
                  .single();

                if (productError) {
                  console.warn(`⚠️ Product ${item.product_id} not available, using default`);
                  return {
                    ...item,
                    products: {
                      nama_produk: 'Produk',
                      gambar_url: null,
                      icon: '🌿'
                    }
                  };
                }

                return { ...item, products: productData };
              } catch (error) {
                console.error(`❌ Error fetching product ${item.product_id}:`, error);
                return {
                  ...item,
                  products: {
                    nama_produk: 'Produk',
                    gambar_url: null,
                    icon: '🌿'
                  }
                };
              }
            })
          );

          return {
            ...order,
            order_items: itemsWithProducts,
            total_items: itemsData?.length || 0,
            total_quantity: itemsData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
          };
        })
      );

      setOrders(ordersWithItems);

    } catch (error) {
      console.error('❌ Error in fetchOrders:', error);
      toast.error('Gagal memuat pesanan: ' + error.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId) => {
    try {
      console.log('📋 Fetching order detail:', orderId);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      const itemsWithProducts = await Promise.all(
        (itemsData || []).map(async (item) => {
          try {
            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('nama_produk, gambar_url, icon')
              .eq('id', item.product_id)
              .single();

            if (productError) {
              console.warn(`⚠️ Product ${item.product_id} not available, using default`);
              return {
                ...item,
                products: {
                  nama_produk: 'Produk',
                  gambar_url: null,
                  icon: '🌿'
                }
              };
            }

            return { ...item, products: productData };
          } catch (error) {
            console.error(`❌ Error fetching product ${item.product_id}:`, error);
            return {
              ...item,
              products: {
                nama_produk: 'Produk',
                gambar_url: null,
                icon: '🌿'
              }
            };
          }
        })
      );

      const userData = {
        nama_lengkap: user?.user_metadata?.full_name || user?.email || 'Customer',
        email: user?.email || '-',
        no_telepon: user?.user_metadata?.phone || '-',
        alamat: user?.user_metadata?.address || '-',
        kota: user?.user_metadata?.city || '-',
        provinsi: user?.user_metadata?.province || '-'
      };

      setSelectedOrder({
        ...orderData,
        order_items: itemsWithProducts,
        users: userData
      });

    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast.error('Gagal memuat detail pesanan: ' + error.message);
    }
  };

  // Fixed dark mode status badges
  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        text: 'Menunggu Pembayaran',
        color: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      },
      paid: {
        text: 'Dibayar',
        color: 'bg-blue-100 text-blue-800 border border-blue-200'
      },
      dikonfirmasi: {
        text: 'Dikonfirmasi',
        color: 'bg-green-100 text-green-800 border border-green-200'
      },
      dikirim: {
        text: 'Dikirim',
        color: 'bg-purple-100 text-purple-800 border border-purple-200'
      },
      selesai: {
        text: 'Selesai',
        color: 'bg-green-100 text-green-800 border border-green-200'
      },
      dibatalkan: {
        text: 'Dibatalkan',
        color: 'bg-red-100 text-red-800 border border-red-200'
      }
    };

    return badges[status] || badges.pending;
  };

  const getDisplayStatus = (order) => {
    return order.status_pengiriman || order.status_pembayaran || 'pending';
  };

  // ✅ Fungsi untuk cek apakah pesanan masih bisa dibatalkan (dalam 1 hari)
  const canCancelOrder = (order) => {
    // Hanya bisa cancel jika status masih pending/unpaid
    const status = order.status_pembayaran || order.status_pengiriman || 'pending';
    if (status !== 'pending' && status !== 'unpaid') {
      return false;
    }

    // Cek apakah sudah melebihi batas waktu (1 hari = 24 jam)
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const diffTime = now - orderDate;
    const diffHours = diffTime / (1000 * 60 * 60); // Convert ke jam

    // Bisa cancel jika belum melebihi 1 hari (24 jam)
    return diffHours <= 24;
  };

  // ✅ Fungsi untuk mendapatkan sisa waktu cancel (dalam jam)
  const getRemainingCancelTime = (order) => {
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const diffTime = (orderDate.getTime() + (24 * 60 * 60 * 1000)) - now.getTime(); // 1 hari dari order date
    const diffHours = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60)));
    return diffHours;
  };

  // ✅ Fungsi untuk batalkan pesanan
  const handleCancelOrder = async (order) => {
    // Validasi ulang sebelum cancel
    if (!canCancelOrder(order)) {
      toast.error('Pesanan tidak bisa dibatalkan. Batas waktu pembatalan adalah 1 hari (24 jam) sejak pesanan dibuat.');
      return;
    }

    // Konfirmasi dari user
    const confirmMessage = 'Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);

      // Update status pesanan menjadi dibatalkan
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status_pembayaran: 'dibatalkan',
          status_pengiriman: 'dibatalkan',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      // Kembalikan stok produk jika ada
      if (order.order_items && order.order_items.length > 0) {
        for (const item of order.order_items) {
          try {
            // Get current stock
            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('stok')
              .eq('id', item.product_id)
              .single();

            if (!productError && productData) {
              // Update stock - kembalikan stok yang sudah dikurangi
              const newStock = (parseInt(productData.stok) || 0) + (parseInt(item.quantity) || 0);
              await supabase
                .from('products')
                .update({ stok: newStock })
                .eq('id', item.product_id);
            }
          } catch (stockError) {
            console.warn('Error updating stock for product:', item.product_id, stockError);
            // Continue dengan produk lain meskipun ada error
          }
        }
      }

      toast.success('Pesanan berhasil dibatalkan');

      // Refresh orders list
      await fetchOrders();

      // Close detail modal if open
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
      }

    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Gagal membatalkan pesanan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCAzM0M0MS4xNjM0IDMzIDM0IDQwLjE2MzQgMzQgNTBDMzQgNTkuODM2NiA0MS4xNjM0IDY3IDUwIDY3QzU4LjgzNjYgNjcgNjYgNTkuODM2NiA2NiA1MEM2NiA0MC4xNjM0IDU4LjgzNjYgMzMgNTAgMzNaIiBmaWxsPSIjMDlCOEI2Ii8+CjxwYXRoIGQ9Ik01MCA0MEM1NC40MTgzIDQwIDU4IDQzLjU4MTcgNTggNDhDNTggNTIuNDE4MyA1NC40MTgzIDU2IDUwIDU2QzQ1LjU4MTcgNTYgNDIgNTIuNDE4MyA0MiA0OEM0MiA0My41ODE3IDQ1LjU4MTcgNDAgNTAgNDBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
    e.target.onerror = null;
  };

  if (loading) {
    return (
      <div className="min-h-screen mt-16 flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen mt-16 py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-5xl mb-3">📦</div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">
            Belum Ada Pesanan
          </h1>
          <p className="mb-6 text-sm text-gray-600">
            Yuk, mulai belanja tanaman favoritmu!
          </p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-2 rounded-lg font-semibold transition-colors duration-300 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Jelajahi Produk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-16 py-6 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          Pesanan Saya
        </h1>

        <div className="space-y-4">
          {orders.map((order) => {
            const displayStatus = getDisplayStatus(order);
            const statusBadge = getStatusBadge(displayStatus);
            const totalItems = order.total_items || 0;
            const totalQuantity = order.total_quantity || 0;

            return (
              <div key={order.id} className="rounded-xl p-6 transition-all duration-300 bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Order <span className="font-mono">#{order.id}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors duration-300 ${statusBadge.color}`}>
                    {statusBadge.text}
                  </span>
                </div>

                <div className="border-t pt-4 mb-4 border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {totalItems} item ({totalQuantity} pcs)
                    </span>
                    <span className="font-bold text-lg text-emerald-600">
                      {formatCurrency(
                        (parseFloat(order.total_harga) || 0) +
                        (parseFloat(order.biaya_pengiriman) || 0)
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => fetchOrderDetail(order.id)}
                    className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-300 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25"
                  >
                    Lihat Detail
                  </button>
                  {canCancelOrder(order) && (
                    <button
                      onClick={() => handleCancelOrder(order)}
                      disabled={loading}
                      className="px-4 py-3 border rounded-lg text-sm font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600"
                      title={`Batas waktu pembatalan: ${getRemainingCancelTime(order)} jam lagi`}
                    >
                      {loading ? 'Membatalkan...' : 'Batalkan'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white text-gray-900 shadow-2xl border border-gray-200">
              <div className="p-6 border-b sticky top-0 bg-white border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    Detail Pesanan <span className="font-mono">#{selectedOrder.id}</span>
                  </h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 rounded-lg transition-colors duration-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-600">
                      Status Pembayaran
                    </span>
                    <span className={`text-sm font-semibold px-3 py-2 rounded-full block text-center transition-colors duration-300 ${getStatusBadge(selectedOrder.status_pembayaran).color
                      }`}>
                      {getStatusBadge(selectedOrder.status_pembayaran).text}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-600">
                      Status Pengiriman
                    </span>
                    <span className={`text-sm font-semibold px-3 py-2 rounded-full block text-center transition-colors duration-300 ${getStatusBadge(selectedOrder.status_pengiriman).color
                      }`}>
                      {getStatusBadge(selectedOrder.status_pengiriman).text}
                    </span>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <p className="text-sm font-semibold mb-2 text-gray-700">
                    Alamat Pengiriman
                  </p>
                  <p className="text-sm p-3 rounded-lg bg-gray-100 text-gray-600">
                    {selectedOrder.alamat_pengiriman || 'Tidak ada alamat'}
                  </p>
                </div>

                {/* Payment Method */}
                {selectedOrder.metode_pembayaran && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-gray-700">
                      Metode Pembayaran
                    </p>
                    <p className="text-sm p-3 rounded-lg bg-gray-100 text-gray-600">
                      {selectedOrder.metode_pembayaran.charAt(0).toUpperCase() + selectedOrder.metode_pembayaran.slice(1)}
                    </p>
                  </div>
                )}

                {/* Items Section */}
                <div>
                  <p className="text-sm font-semibold mb-3 text-gray-700">
                    Items
                  </p>
                  <div className="space-y-3">
                    {(selectedOrder.order_items || []).map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          {item.products?.gambar_url ? (
                            <img
                              src={item.products.gambar_url}
                              alt={item.products.nama_produk}
                              className="w-full h-full object-cover"
                              onError={handleImageError}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-emerald-400 to-teal-600">
                              {item.products?.icon || '🌿'}
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold text-sm mb-1 text-gray-900">
                            {item.products?.nama_produk || 'Produk'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.quantity || 0} x {formatCurrency(item.harga_satuan || 0)}
                          </p>
                        </div>
                        <p className="font-bold text-lg text-emerald-600">
                          {formatCurrency((item.quantity || 0) * (item.harga_satuan || 0))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Section */}
                <div className="border-t pt-4 space-y-3 border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal
                    </span>
                    <span className="font-semibold">{formatCurrency(selectedOrder.total_harga || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Ongkir
                    </span>
                    <span className="font-semibold">{formatCurrency(selectedOrder.biaya_pengiriman || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-3 border-gray-200">
                    <span>Total</span>
                    <span className="text-xl text-emerald-600">
                      {formatCurrency(
                        (parseFloat(selectedOrder.total_harga) || 0) +
                        (parseFloat(selectedOrder.biaya_pengiriman) || 0)
                      )}
                    </span>
                  </div>
                </div>

                {/* Cancel Button in Detail Modal */}
                {canCancelOrder(selectedOrder) && (
                  <div className="border-t pt-4 border-gray-200">
                    <div className="mb-3 p-3 rounded-lg text-sm bg-yellow-50 text-yellow-800 border border-yellow-200">
                      <p className="font-semibold mb-1">
                        ⏰ Batas Waktu Pembatalan
                      </p>
                      <p>
                        Anda dapat membatalkan pesanan ini dalam {getRemainingCancelTime(selectedOrder)} jam lagi.
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelOrder(selectedOrder)}
                      disabled={loading}
                      className="w-full py-3 rounded-lg text-sm font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 text-white"
                    >
                      {loading ? 'Membatalkan...' : 'Batalkan Pesanan'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;