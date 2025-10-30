import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

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
      // PERBAIKAN: Tambahkan validasi untuk user.id
      if (!user || !user.id) {
        toast.error('User tidak valid');
        return;
      }

      // PERBAIKAN: Gunakan environment variable untuk base URL
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE_URL}/api/orders/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // PERBAIKAN: Tambahkan error handling untuk CORS
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []); // PERBAIKAN: Pastikan selalu array
      } else {
        throw new Error(data.message || 'Gagal memuat pesanan');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Gagal memuat pesanan: ' + error.message);
      setOrders([]); // PERBAIKAN: Set ke array kosong jika error
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId) => {
    try {
      // PERBAIKAN: Gunakan environment variable untuk base URL
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE_URL}/api/order/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setSelectedOrder(data.order);
      } else {
        throw new Error(data.message || 'Gagal memuat detail pesanan');
      }
    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast.error('Gagal memuat detail pesanan: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
      dikonfirmasi: { text: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-800' },
      dikirim: { text: 'Dikirim', color: 'bg-purple-100 text-purple-800' },
      selesai: { text: 'Selesai', color: 'bg-green-100 text-green-800' },
      dibatalkan: { text: 'Dibatalkan', color: 'bg-red-100 text-red-800' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen mt-16 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // PERBAIKAN: Cek jika orders tidak ada atau kosong
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

  return (
    <div className="min-h-screen mt-16 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-primary mb-4">Pesanan Saya</h1>

        <div className="space-y-3">
          {orders.map((order) => {
            const statusBadge = getStatusBadge(order.status_pengiriman || order.status);
            
            return (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Order #{order.id}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusBadge.color}`}>
                    {statusBadge.text}
                  </span>
                </div>

                <div className="border-t pt-3 mb-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{order.total_items || 0} items</span>
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
                  {order.status === 'pending' && (
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
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusBadge(selectedOrder.status_pengiriman || selectedOrder.status).color}`}>
                    {getStatusBadge(selectedOrder.status_pengiriman || selectedOrder.status).text}
                  </span>
                </div>

                {/* Alamat */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Alamat Pengiriman</p>
                  <p className="text-sm text-gray-600">{selectedOrder.alamat_pengiriman || 'Tidak ada alamat'}</p>
                </div>

                {/* Catatan */}
                {selectedOrder.catatan && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Catatan</p>
                    <p className="text-sm text-gray-600">{selectedOrder.catatan}</p>
                  </div>
                )}

                {/* Items */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Items</p>
                  <div className="space-y-2">
                    {/* PERBAIKAN: Null check untuk items */}
                    {(selectedOrder.orderItems || []).map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className="w-10 h-10 bg-gradient-to-br from-secondary to-accent rounded flex items-center justify-center text-lg flex-shrink-0">
                          {item.icon || '🌿'}
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold text-sm">{item.nama_produk || 'Produk'}</p>
                          <p className="text-xs text-gray-600">
                            {item.quantity || 0} x {formatCurrency(item.harga_satuan || 0)}
                          </p>
                        </div>
                        <p className="font-bold text-sm">{formatCurrency((item.quantity || 0) * (item.harga_satuan || 0))}</p>
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