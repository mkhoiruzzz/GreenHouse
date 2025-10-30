// src/pages/Orders.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

// Import supabase
let supabase;
try {
  const supabaseModule = await import('../config/supabase');
  supabase = supabaseModule.supabase;
  console.log('✅ Supabase loaded successfully');
} catch (error) {
  console.warn('⚠️ Supabase config not found, using fallback');
  supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null })
        }),
        single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      })
    })
  };
}

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

 // Di fetchOrders function, tambahkan error handling:
const fetchOrders = async () => {
  try {
    setLoading(true);
    
    if (!user || !user.id) {
      toast.error('User tidak valid');
      return;
    }

    console.log('🔄 Fetching orders for user:', user.id);

    // ✅ ADD TIMEOUT untuk HP yang lambat
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );

    const fetchPromise = supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: ordersData, error: ordersError } = await Promise.race([fetchPromise, timeoutPromise]);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      // ✅ TAMPILKAN ERROR DETAIL DI HP
      alert(`Error: ${ordersError.message}`);
      toast.error('Gagal memuat pesanan');
      setOrders([]);
      return;
    }

    console.log('✅ Orders fetched:', ordersData);

    // ... rest of your code ...

  } catch (error) {
    console.error('❌ Error in fetchOrders:', error);
    // ✅ TAMPILKAN ERROR DI HP
    alert(`Fetch Error: ${error.message}`);
    toast.error('Gagal memuat pesanan: ' + error.message);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};

  const fetchOrderDetail = async (orderId) => {
  try {
    console.log('📋 Fetching order detail:', orderId);

    // Ambil data order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Ambil order items
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    // Ambil product info untuk setiap item
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
                nama_produk: 'Product',
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
              nama_produk: 'Product',
              gambar_url: null,
              icon: '🌿'
            }
          };
        }
      })
    );

    // ✅ SOLUSI 4: Skip profiles table, gunakan data dari AuthContext saja
    const userData = {
      nama_lengkap: user?.user_metadata?.full_name || user?.email || 'Customer',
      email: user?.email || '-',
      no_telepon: user?.user_metadata?.phone || '-',
      alamat: user?.user_metadata?.address || '-',
      kota: user?.user_metadata?.city || '-',
      provinsi: user?.user_metadata?.province || '-'
    };

    console.log('✅ Using user data from AuthContext:', userData);

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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800' },
      paid: { text: 'Dibayar', color: 'bg-blue-100 text-blue-800' },
      dikonfirmasi: { text: 'Dikonfirmasi', color: 'bg-green-100 text-green-800' },
      dikirim: { text: 'Dikirim', color: 'bg-purple-100 text-purple-800' },
      selesai: { text: 'Selesai', color: 'bg-green-100 text-green-800' },
      dibatalkan: { text: 'Dibatalkan', color: 'bg-red-100 text-red-800' }
    };
    
    // Gunakan status_pengiriman jika ada, fallback ke status_pembayaran
    return badges[status] || badges.pending;
  };

  // Tentukan status yang akan ditampilkan
  const getDisplayStatus = (order) => {
    return order.status_pengiriman || order.status_pembayaran || 'pending';
  };

  if (loading) {
    return (
      <div className="min-h-screen mt-16 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen mt-16 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-5xl mb-3">📦</div>
          <h1 className="text-2xl font-bold text-primary mb-2">Belum Ada Pesanan</h1>
          <p className="text-gray-600 mb-6 text-sm">Yuk, mulai belanja tanaman favoritmu!</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-secondary text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent transition text-sm"
          >
            Jelajahi Produk
          </button>
        </div>
      </div>
    );
  }

  // Di App.jsx atau Orders.jsx, tambahkan:
useEffect(() => {
  // Cek koneksi internet
  if (!navigator.onLine) {
    toast.error('Tidak ada koneksi internet');
  }

  // Listen untuk online/offline
  const handleOnline = () => toast.success('Koneksi pulih');
  const handleOffline = () => toast.error('Koneksi internet terputus');

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

  return (
    <div className="min-h-screen mt-16 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-primary mb-4">Pesanan Saya</h1>

        <div className="space-y-3">
          {orders.map((order) => {
            const displayStatus = getDisplayStatus(order);
            const statusBadge = getStatusBadge(displayStatus);
            const totalItems = order.total_items || 0;
            const totalQuantity = order.total_quantity || 0;
            
            return (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Order #{order.id}</p>
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
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusBadge.color}`}>
                    {statusBadge.text}
                  </span>
                </div>

                <div className="border-t pt-3 mb-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {totalItems} items ({totalQuantity} pcs)
                    </span>
                    <span className="font-bold text-primary">
                      Total: {formatCurrency(
                        (parseFloat(order.total_harga) || 0) + 
                        (parseFloat(order.biaya_pengiriman) || 0)
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => fetchOrderDetail(order.id)}
                    className="flex-1 bg-secondary text-white py-2 rounded-lg text-sm font-semibold hover:bg-accent transition"
                  >
                    Lihat Detail
                  </button>
                  {(order.status_pembayaran === 'pending' || displayStatus === 'pending') && (
                    <button className="px-4 py-2 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition">
                      Batalkan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b sticky top-0 bg-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-primary">Detail Pesanan #{selectedOrder.id}</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status Pembayaran</span>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusBadge(selectedOrder.status_pembayaran).color}`}>
                    {getStatusBadge(selectedOrder.status_pembayaran).text}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status Pengiriman</span>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusBadge(selectedOrder.status_pengiriman).color}`}>
                    {getStatusBadge(selectedOrder.status_pengiriman).text}
                  </span>
                </div>

                {/* Alamat */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Alamat Pengiriman</p>
                  <p className="text-sm text-gray-600">{selectedOrder.alamat_pengiriman || 'Tidak ada alamat'}</p>
                </div>

                {/* Metode Pembayaran */}
                {selectedOrder.metode_pembayaran && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Metode Pembayaran</p>
                    <p className="text-sm text-gray-600 capitalize">{selectedOrder.metode_pembayaran}</p>
                  </div>
                )}

                {/* Customer Info */}
                {selectedOrder.users && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Informasi Customer</p>
                    <p className="text-sm text-gray-600">{selectedOrder.users.nama_lengkap}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.users.email}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.users.no_telepon}</p>
                  </div>
                )}

                {/* Items */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Items</p>
                  <div className="space-y-2">
                    {(selectedOrder.order_items || []).map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className="w-10 h-10 bg-gradient-to-br from-secondary to-accent rounded flex items-center justify-center text-lg flex-shrink-0">
                          {item.products?.icon || '🌿'}
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold text-sm">{item.products?.nama_produk || 'Produk'}</p>
                          <p className="text-xs text-gray-600">
                            {item.quantity || 0} x {formatCurrency(item.harga_satuan || 0)}
                          </p>
                        </div>
                        <p className="font-bold text-sm">
                          {formatCurrency((item.quantity || 0) * (item.harga_satuan || 0))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(selectedOrder.total_harga || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ongkir</span>
                    <span className="font-semibold">{formatCurrency(selectedOrder.biaya_pengiriman || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-secondary">
                      {formatCurrency(
                        (parseFloat(selectedOrder.total_harga) || 0) + 
                        (parseFloat(selectedOrder.biaya_pengiriman) || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;