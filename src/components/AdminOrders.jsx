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
            // ✅ Security/Policy: Admin is NOT allowed to manually set an order to PAID
            // Payment status must ONLY be updated via Tripay Webhook for data integrity.
            if (field === 'status_pembayaran' && (value === 'paid' || value === 'lunas')) {
                toast.error('Admin tidak diperbolehkan mengubah status pembayaran ke LUNAS secara manual. Status ini akan terupdate otomatis via Tripay.');
                return;
            }

            // ✅ Validasi: Jika merubah status pengiriman ke Selesai/Delivered, cek apakah sudah bayar
            if (field === 'status_pengiriman' && (value === 'delivered' || value === 'selesai' || value === 'terima' || value === 'Selesai')) {
                const orderToUpdate = orders.find(o => o.id === orderId) || selectedOrder;

                if (orderToUpdate && orderToUpdate.status_pembayaran !== 'paid' && orderToUpdate.status_pembayaran !== 'lunas') {
                    toast.warning('Pesanan ini belum dibayar. Harap verifikasi pembayaran sebelum menyelesa ikan pengiriman.');
                    return;
                }
            }

            console.log(`🔄 Updating order ${orderId}: ${field} -> ${value}`);
            const { error } = await supabase
                .from('orders')
                .update({ [field]: value })
                .eq('id', orderId);

            if (error) {
                console.error('❌ Supabase Update Error Details:', JSON.stringify(error, null, 2));
                throw error;
            }

            toast.success(`Status ${field === 'status_pembayaran' ? 'Pembayaran' : 'Pengiriman'} diperbarui ke: ${getStatusLabel(value)}`);
            fetchOrders();

            // ✅ Kirim notifikasi ke user via database
            const orderToNotify = orders.find(o => o.id === orderId) || selectedOrder;
            if (orderToNotify && orderToNotify.user_id) {
                let notifTitle = 'Update Pesanan';
                let notifMessage = `Status ${field === 'status_pembayaran' ? 'pembayaran' : 'pengiriman'} pesanan #${orderId} telah diperbarui menjadi ${getStatusLabel(value)}.`;
                let notifType = field === 'status_pembayaran' ? 'payment' : 'shipping';

                if (field === 'status_pengiriman') {
                    if (value === 'shipped' || value === 'dikirim') {
                        notifTitle = 'Pesanan Dikirim 🚚';
                        notifMessage = `Hore! Pesanan #${orderId} sedang dalam perjalanan.`;
                    } else if (value === 'delivered' || value === 'selesai' || value === 'terima') {
                        notifTitle = 'Pesanan Sampai ✅';
                        notifMessage = `Pesanan #${orderId} telah sampai. Silakan berikan ulasan!`;
                    } else if (value === 'processing' || value === 'diproses') {
                        notifTitle = 'Pesanan Diproses 📦';
                        notifMessage = `Pesanan #${orderId} sedang disiapkan oleh kami.`;
                    }
                } else if (field === 'status_pembayaran' && (value === 'paid' || value === 'lunas')) {
                    notifTitle = 'Pembayaran Dikonfirmasi ✅';
                    notifMessage = `Pembayaran pesanan #${orderId} telah kami terima. Terima kasih!`;
                }

                console.log('📝 Attempting to insert notification for user:', orderToNotify.user_id);
                const { error: notifError } = await supabase.from('notifications').insert({
                    user_id: orderToNotify.user_id,
                    type: notifType,
                    title: notifTitle,
                    message: notifMessage,
                    order_id: orderId,
                    link: '/orders'
                });

                if (notifError) console.error('❌ Failed to insert notification:', notifError);
                else console.log('✅ Notification inserted successfully');
            } else {
                console.warn('⚠️ No user found to notify for order:', orderId);
            }

            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, [field]: value });
            }
        } catch (error) {
            console.error('❌ Error updating order:', error);
            const errorMsg = error.message || (typeof error === 'object' ? JSON.stringify(error) : 'Unknown error');
            toast.error(`Gagal: ${errorMsg}`);
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
        const s = (status || 'pending').toLowerCase();
        const labels = {
            paid: 'Telah Dibayar',
            unpaid: 'Belum Bayar',
            expired: 'Kedaluwarsa',
            pending: 'Menunggu',
            processing: 'Diproses',
            shipped: 'Dikirim',
            completed: 'Selesai',
            failed: 'Gagal',
            dikonfirmasi: 'Dikonfirmasi',
            dikirim: 'Dikirim',
            selesai: 'Selesai',
            dibatalkan: 'Dibatalkan',
            cancelled: 'Dibatalkan',
            diproses: 'Sedang Diproses',
            dikemas: 'Dikemas',
            terkirim: 'Terkirim',
            diterima: 'Diterima',
            delivered: 'Sudah Sampai',
            lunas: 'Lunas'
        };
        return labels[s] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Menunggu');
    };

    const getStatusBadge = (status) => {
        const s = (status || 'pending').toLowerCase();
        const badges = {
            paid: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
            lunas: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
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
            dibatalkan: 'bg-red-100 text-red-800 border border-red-200',
            cancelled: 'bg-red-100 text-red-800 border border-red-200',
            diproses: 'bg-blue-100 text-blue-800 border border-blue-200',
            dikemas: 'bg-blue-100 text-blue-800 border border-blue-200',
            terkirim: 'bg-purple-100 text-purple-800 border border-purple-200',
            diterima: 'bg-green-100 text-green-800 border border-green-200',
            delivered: 'bg-green-100 text-green-800 border border-green-200'
        };
        return badges[s] || 'bg-gray-100 text-gray-800 border border-gray-200';
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
                        <option value="paid">Telah Dibayar</option>
                        <option value="unpaid">Belum Bayar</option>
                        <option value="expired">Kedaluwarsa</option>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Sticky Header */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex justify-between items-center shadow-md z-10">
                            <div>
                                <h2 className="text-xl font-bold text-white">Detail Pesanan #{selectedOrder.id}</h2>
                                <p className="text-green-50 text-xs">
                                    Dibuat pada: {new Date(selectedOrder.created_at).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {/* Customer & Notes Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <section>
                                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <span>👤</span> Informasi Customer
                                    </h3>
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3 text-sm">
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-500">Nama</span>
                                            <span className="font-semibold text-gray-900">{selectedOrder.customer_name || '-'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-500">Email</span>
                                            <span className="font-semibold text-gray-900">{selectedOrder.customer_email || '-'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-500">Telepon</span>
                                            <span className="font-semibold text-gray-900">{selectedOrder.customer_phone || '-'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500">Alamat</span>
                                            <span className="font-semibold text-gray-900 leading-relaxed">{selectedOrder.alamat_pengiriman || '-'}</span>
                                        </div>
                                    </div>
                                </section>
                                <section>
                                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <span>💬</span> Catatan Customer
                                    </h3>
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 h-full min-h-[120px]">
                                        <p className="text-amber-900 italic text-sm leading-relaxed">
                                            {selectedOrder.catatan ? `"${selectedOrder.catatan}"` : 'Tidak ada catatan khusus dari customer.'}
                                        </p>
                                    </div>
                                </section>
                            </div>

                            {/* Order Items */}
                            <section>
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span>📦</span> Item Pesanan
                                </h3>
                                <div className="space-y-3">
                                    {selectedOrder.order_items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 bg-white border border-gray-100 hover:border-green-200 rounded-xl p-4 transition-colors shadow-sm">
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                                <img
                                                    src={item.products?.gambar_url || 'https://via.placeholder.com/150'}
                                                    alt={item.nama_produk}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 truncate">{item.nama_produk}</p>
                                                <p className="text-sm text-gray-500">
                                                    {formatCurrency(item.harga_satuan)} × {item.quantity}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">
                                                    {formatCurrency(item.harga_satuan * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Order Summary & Payment Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <section>
                                    <h3 className="font-bold text-gray-900 mb-3">💰 Ringkasan Pembayaran</h3>
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Subtotal Produk</span>
                                            <span className="font-medium">{formatCurrency(selectedOrder.order_items?.reduce((sum, item) => sum + (item.harga_satuan * item.quantity), 0) || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Biaya Pengiriman</span>
                                            <span className="font-medium">{formatCurrency(selectedOrder.biaya_pengiriman || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Biaya Layanan</span>
                                            <span className="font-medium">{formatCurrency(selectedOrder.biaya_admin || 0)}</span>
                                        </div>
                                        {selectedOrder.discount_amount > 0 && (
                                            <div className="flex justify-between text-sm text-green-600 font-semibold bg-green-50 p-2 rounded">
                                                <span>Promo ({selectedOrder.voucher_code})</span>
                                                <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3 mt-2 text-gray-900">
                                            <span>Total Akhr</span>
                                            <span className="text-green-600">
                                                {formatCurrency(selectedOrder.total_harga || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="font-bold text-gray-900 mb-3">💳 Informasi Transaksi</h3>
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Metode Pembayaran</p>
                                            <p className="font-semibold text-gray-800">{selectedOrder.metode_pembayaran || '-'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tripay Reference</p>
                                            <p className="font-mono text-sm text-gray-700 bg-white p-2 border border-gray-100 rounded">{selectedOrder.tripay_reference || 'N/A'}</p>
                                        </div>
                                        {selectedOrder.tripay_checkout_url && (
                                            <a
                                                href={selectedOrder.tripay_checkout_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                Cek Detail Tripay ↗
                                            </a>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Status Update Control */}
                            <section className="bg-white border-2 border-green-100 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-extrabold text-gray-900 mb-6 flex items-center gap-2 text-lg">
                                    Manajemen Status Pesanan
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="block text-sm font-bold text-gray-700">
                                            Status Pembayaran
                                        </label>
                                        <div className={`w-full px-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 flex items-center justify-between`}>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(selectedOrder.status_pembayaran)}`}>
                                                {getStatusLabel(selectedOrder.status_pembayaran)}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium uppercase italic">Dikelola Tripay</span>
                                        </div>
                                        <p className="text-[10px] text-amber-600 font-medium leading-tight">
                                            ⚠️ Status ini terkunci. Hanya bisa berubah melalui sistem pembayaran otomatis.
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-sm font-bold text-gray-700">
                                            Status Pengiriman
                                        </label>
                                        {selectedOrder.status_pembayaran === 'paid' || selectedOrder.status_pembayaran === 'lunas' ? (
                                            <select
                                                value={selectedOrder.status_pengiriman || 'pending'}
                                                onChange={(e) => updateOrderStatus(selectedOrder.id, 'status_pengiriman', e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-green-500 rounded-xl bg-white text-gray-900 font-semibold focus:border-green-600 transition-colors outline-none cursor-pointer shadow-sm"
                                            >
                                                <option value="pending"> Belum Diproses</option>
                                                <option value="processing"> Sedang Disiapkan</option>
                                                <option value="shipped">Dalam Perjalanan</option>
                                                <option value="delivered"> Selesai Sampai Tujuan</option>
                                                <option value="cancelled"> Dibatalkan</option>
                                            </select>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-400 font-semibold cursor-not-allowed flex items-center justify-between">
                                                    <span>Pesanan Belum Lunas</span>
                                                    <span>🔒</span>
                                                </div>
                                                <p className="text-[10px] text-red-500 font-bold bg-red-50 p-2 rounded border border-red-100 italic">
                                                    * Selesaikan pembayaran untuk memproses pengiriman.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer / Action (Optional if needed) */}
                        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-100">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
