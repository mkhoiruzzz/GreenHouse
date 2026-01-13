// AdminOrders.jsx - Order Management untuk Admin
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatCurrency';


const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [filterStatus]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('orders')
                .select(`
          *,
          order_items (
            *,
            products (
              nama_produk,
              gambar_url
            )
          )
        `)
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                query = query.eq('status_pembayaran', filterStatus);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Get user info for each order
            const ordersWithUsers = await Promise.all(
                (data || []).map(async (order) => {
                    try {
                        const { data: userData } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', order.user_id)
                            .single();

                        return {
                            ...order,
                            user: userData || { email: order.customer_email, full_name: order.customer_name }
                        };
                    } catch (err) {
                        return {
                            ...order,
                            user: { email: order.customer_email, full_name: order.customer_name }
                        };
                    }
                })
            );

            setOrders(ordersWithUsers);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Gagal memuat pesanan');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, field, value) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ [field]: value })
                .eq('id', orderId);

            if (error) throw error;

            toast.success('Status pesanan berhasil diperbarui');
            fetchOrders();

            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, [field]: value });
            }
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Gagal memperbarui status pesanan');
        }
    };

    const checkTripayStatus = async (order) => {
        if (!order.tripay_reference) {
            toast.error('Tidak ada reference Tripay untuk pesanan ini');
            return;
        }

        try {
            toast.info('Memeriksa status pembayaran Tripay...');

            // Call Tripay API to check status
            const response = await fetch(
                `https://tripay.co.id/api-sandbox/transaction/detail?reference=${order.tripay_reference}`,
                {
                    headers: {
                        'Authorization': `Bearer ${import.meta.env.VITE_TRIPAY_API_KEY || ''}`
                    }
                }
            );

            const result = await response.json();

            if (result.success && result.data) {
                const tripayStatus = result.data.status;

                // Update order status based on Tripay status
                if (tripayStatus === 'PAID') {
                    await updateOrderStatus(order.id, 'status_pembayaran', 'paid');
                    toast.success('Pembayaran sudah lunas di Tripay');
                } else if (tripayStatus === 'UNPAID') {
                    await updateOrderStatus(order.id, 'status_pembayaran', 'unpaid');
                    toast.info('Pembayaran belum lunas');
                } else if (tripayStatus === 'EXPIRED') {
                    await updateOrderStatus(order.id, 'status_pembayaran', 'expired');
                    toast.warning('Pembayaran sudah expired');
                }
            } else {
                toast.error('Gagal memeriksa status Tripay');
            }
        } catch (error) {
            console.error('Error checking Tripay status:', error);
            toast.error('Gagal memeriksa status pembayaran');
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.tripay_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toString().includes(searchTerm);

        return matchesSearch;
    });

    const getStatusLabel = (status) => {
        const labels = {
            paid: 'Paid',
            unpaid: 'Unpaid',
            expired: 'Expired',
            pending: 'Pending',
            processing: 'Processing',
            shipped: 'Shipped',
            completed: 'Completed',
            failed: 'Failed',
            dikonfirmasi: 'Confirmed',
            dikirim: 'Shipped',
            selesai: 'Completed',
            dibatalkan: 'Cancelled'
        };
        return labels[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending');
    };

    const getStatusBadge = (status) => {
        const badges = {
            paid: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
            unpaid: 'bg-red-100 text-red-800 border border-red-200',
            expired: 'bg-gray-100 text-gray-800 border border-gray-200',
            pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
            processing: 'bg-blue-100 text-blue-800 border border-blue-200',
            shipped: 'bg-purple-100 text-purple-800 border border-purple-200',
            completed: 'bg-green-100 text-green-800 border border-green-200',
            failed: 'bg-red-100 text-red-800 border border-red-200',
            dikonfirmasi: 'bg-blue-100 text-blue-800 border border-blue-200',
            dikirim: 'bg-purple-100 text-purple-800 border border-purple-200',
            selesai: 'bg-green-100 text-green-800 border border-green-200',
            dibatalkan: 'bg-red-100 text-red-800 border border-red-200'
        };
        return badges[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
    };

    const stats = {
        total: orders.length,
        paid: orders.filter(o => o.status_pembayaran === 'paid').length,
        unpaid: orders.filter(o => o.status_pembayaran === 'unpaid').length,
        totalRevenue: orders
            .filter(o => o.status_pembayaran === 'paid')
            .reduce((sum, o) => sum + parseFloat(o.total_harga || 0), 0)
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium">Total Pesanan</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-100">
                    <p className="text-sm text-green-600 font-medium">Sudah Dibayar</p>
                    <p className="text-2xl font-bold text-green-700">{stats.paid}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-100">
                    <p className="text-sm text-yellow-600 font-medium">Belum Dibayar</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.unpaid}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-100">
                    <p className="text-sm text-purple-600 font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-700">
                        {formatCurrency(stats.totalRevenue)}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="🔍 Cari pesanan (nama, email, reference)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    >
                        <option value="all">Semua Status</option>
                        <option value="paid">Sudah Dibayar</option>
                        <option value="unpaid">Belum Dibayar</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">📦 Daftar Pesanan</h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-xl font-semibold text-gray-700">Tidak ada pesanan</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 text-left text-sm font-bold text-gray-700">ID</th>
                                    <th className="p-4 text-left text-sm font-bold text-gray-700">Customer</th>
                                    <th className="p-4 text-left text-sm font-bold text-gray-700">Total</th>
                                    <th className="p-4 text-left text-sm font-bold text-gray-700">Status Pembayaran</th>
                                    <th className="p-4 text-left text-sm font-bold text-gray-700">Status Pengiriman</th>
                                    <th className="p-4 text-left text-sm font-bold text-gray-700">Tanggal</th>
                                    <th className="p-4 text-center text-sm font-bold text-gray-700">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        <td className="p-4">
                                            <span className="font-mono text-sm">#{order.id}</span>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="font-semibold text-gray-800">{order.customer_name || '-'}</p>
                                                <p className="text-xs text-gray-500">{order.customer_email || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-green-600">
                                                {formatCurrency(order.total_harga || 0)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status_pembayaran)}`}>
                                                {getStatusLabel(order.status_pembayaran)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status_pengiriman)}`}>
                                                {getStatusLabel(order.status_pengiriman)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-gray-600">
                                                {new Date(order.created_at).toLocaleDateString('id-ID')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedOrder(order);
                                                    }}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                                                >
                                                    Detail
                                                </button>
                                                {order.tripay_reference && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            checkTripayStatus(order);
                                                        }}
                                                        className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                                                    >
                                                        Cek Tripay
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Detail Pesanan #{selectedOrder.id}</h2>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-white hover:text-gray-200 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Customer Info */}
                            <div>
                                <h3 className="font-bold text-gray-800 mb-2">Informasi Customer</h3>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <p><span className="font-semibold">Nama:</span> {selectedOrder.customer_name || '-'}</p>
                                    <p><span className="font-semibold">Email:</span> {selectedOrder.customer_email || '-'}</p>
                                    <p><span className="font-semibold">Telepon:</span> {selectedOrder.customer_phone || '-'}</p>
                                    <p><span className="font-semibold">Alamat:</span> {selectedOrder.alamat_pengiriman || '-'}</p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="font-bold text-gray-800 mb-2">Item Pesanan</h3>
                                <div className="space-y-2">
                                    {selectedOrder.order_items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                                            <img
                                                src={item.products?.gambar_url || '🌱'}
                                                alt={item.nama_produk}
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800">{item.nama_produk}</p>
                                                <p className="text-sm text-gray-600">
                                                    {formatCurrency(item.harga_satuan)} × {item.quantity}
                                                </p>
                                            </div>
                                            <p className="font-bold text-green-600">
                                                {formatCurrency(item.harga_satuan * item.quantity)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div>
                                <h3 className="font-bold text-gray-800 mb-2">Ringkasan</h3>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal Produk:</span>
                                        <span>{formatCurrency(selectedOrder.order_items?.reduce((sum, item) => sum + (item.harga_satuan * item.quantity), 0) || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Biaya Pengiriman:</span>
                                        <span>{formatCurrency(selectedOrder.biaya_pengiriman || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Biaya Admin:</span>
                                        <span>{formatCurrency(selectedOrder.biaya_admin || 0)}</span>
                                    </div>
                                    {selectedOrder.discount_amount > 0 && (
                                        <div className="flex justify-between text-green-600 font-medium">
                                            <span>Voucher ({selectedOrder.voucher_code}):</span>
                                            <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                                        <span>Total Tagihan:</span>
                                        <span className="text-green-600">
                                            {formatCurrency(selectedOrder.total_harga || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Info */}
                            {selectedOrder.tripay_reference && (
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-2">Informasi Pembayaran</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <p><span className="font-semibold">Tripay Reference:</span> {selectedOrder.tripay_reference}</p>
                                        <p><span className="font-semibold">Metode Pembayaran:</span> {selectedOrder.metode_pembayaran || '-'}</p>
                                        {selectedOrder.tripay_checkout_url && (
                                            <a
                                                href={selectedOrder.tripay_checkout_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Lihat di Tripay →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Status Update */}
                            <div>
                                <h3 className="font-bold text-gray-800 mb-4">Update Status</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status Pembayaran
                                        </label>
                                        <select
                                            value={selectedOrder.status_pembayaran || 'pending'}
                                            onChange={(e) => updateOrderStatus(selectedOrder.id, 'status_pembayaran', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="unpaid">Unpaid</option>
                                            <option value="paid">Paid</option>
                                            <option value="expired">Expired</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status Pengiriman
                                        </label>
                                        <select
                                            value={selectedOrder.status_pengiriman || 'pending'}
                                            onChange={(e) => updateOrderStatus(selectedOrder.id, 'status_pengiriman', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div>
    );
};

export default AdminOrders;
