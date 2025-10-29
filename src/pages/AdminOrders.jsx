import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminOrders = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      toast.error('Akses ditolak. Admin only!');
      navigate('/');
      return;
    }
    fetchAllOrders();
  }, [isAuthenticated, isAdmin]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/orders');
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error('Gagal memuat data pesanan');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const updateOrderStatus = async (orderId, statusType, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [statusType]: newStatus
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Status berhasil diupdate!');
        fetchAllOrders();
      } else {
        toast.error(data.message || 'Gagal update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const getStatusBadge = (status, type = 'payment') => {
    if (type === 'payment') {
      const badges = {
        pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
        paid: { text: 'Paid', color: 'bg-green-100 text-green-800' },
        cancelled: { text: 'Cancelled', color: 'bg-red-100 text-red-800' }
      };
      return badges[status] || badges.pending;
    } else {
      const badges = {
        pending: { text: 'Pending', color: 'bg-gray-100 text-gray-800' },
        processing: { text: 'Processing', color: 'bg-blue-100 text-blue-800' },
        shipped: { text: 'Shipped', color: 'bg-purple-100 text-purple-800' },
        delivered: { text: 'Delivered', color: 'bg-green-100 text-green-800' },
        cancelled: { text: 'Cancelled', color: 'bg-red-100 text-red-800' }
      };
      return badges[status] || badges.pending;
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status_pembayaran === filterStatus);

  if (loading) {
    return (
      <div className="min-h-screen mt-16 py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-16 py-6 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Admin - Manage Orders</h1>
              <p className="text-gray-600 mt-1">Kelola semua pesanan pelanggan</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-secondary">{orders.length}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
          </div>
        </div>

        {/* Filter Status */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterStatus === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterStatus === 'pending' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({orders.filter(o => o.status_pembayaran === 'pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterStatus === 'paid' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paid ({orders.filter(o => o.status_pembayaran === 'paid').length})
            </button>
            <button
              onClick={() => setFilterStatus('cancelled')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterStatus === 'cancelled' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled ({orders.filter(o => o.status_pembayaran === 'cancelled').length})
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status Pembayaran</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status Pengiriman</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-semibold text-primary">#{order.id}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-semibold text-sm">{order.nama_lengkap}</div>
                        <div className="text-xs text-gray-600">{order.email}</div>
                        <div className="text-xs text-gray-500">{order.no_telepon}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {order.items && order.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                            {item.gambar_url && !imageErrors[item.id] ? (
                              <img
                                src={item.gambar_url}
                                alt={item.nama_produk}
                                className="w-6 h-6 rounded object-cover"
                                onError={() => handleImageError(item.id)}
                              />
                            ) : (
                              <span className="text-xs">{item.icon || '🌿'}</span>
                            )}
                            <span className="text-xs">{item.quantity}x</span>
                          </div>
                        ))}
                        {order.items && order.items.length > 2 && (
                          <span className="text-xs text-gray-500">+{order.items.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-primary">{formatCurrency(order.total_harga)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        {order.metode_pembayaran === 'transfer' && '🏦 Transfer'}
                        {order.metode_pembayaran === 'cod' && '💵 COD'}
                        {order.metode_pembayaran === 'ewallet' && '📱 E-Wallet'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status_pembayaran}
                        onChange={(e) => updateOrderStatus(order.id, 'status_pembayaran', e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${
                          getStatusBadge(order.status_pembayaran, 'payment').color
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status_pengiriman}
                        onChange={(e) => updateOrderStatus(order.id, 'status_pengiriman', e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${
                          getStatusBadge(order.status_pengiriman, 'shipping').color
                        }`}
                        disabled={order.status_pembayaran !== 'paid'}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="text-secondary hover:text-accent font-semibold text-sm"
                      >
                        Detail →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">📦</div>
            <p>Tidak ada pesanan {filterStatus !== 'all' && `dengan status ${filterStatus}`}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;