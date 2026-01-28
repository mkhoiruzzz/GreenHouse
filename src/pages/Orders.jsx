// src/pages/Orders.jsx - FIXED DARK MODE + CANCEL ORDER (1 DAY LIMIT)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../lib/supabase';

const TrackingTimeline = ({ status }) => {
    const steps = [
        { id: 'pending', label: 'Pesanan Dibuat', icon: '📝' },
        { id: 'processing', label: 'Diproses', icon: '📦' },
        { id: 'shipped', label: 'Dalam Perjalanan', icon: '🚚' },
        { id: 'delivered', label: 'Sampai Tujuan', icon: '✅' }
    ];

    const currentIdx = steps.findIndex(s => s.id === (status || 'pending').toLowerCase()) === -1
        ? (status.toLowerCase() === 'selesai' || status.toLowerCase() === 'completed' ? 3 : 0)
        : steps.findIndex(s => s.id === (status || 'pending').toLowerCase());

    return (
        <div className="py-8 px-2">
            <div className="relative flex justify-between">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
                {/* Progress Bar Active */}
                <div
                    className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-1000"
                    style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, idx) => {
                    const isActive = idx <= currentIdx;
                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${isActive ? 'bg-emerald-500 text-white scale-110 shadow-lg' : 'bg-white border-2 border-gray-300 text-gray-400'
                                }`}>
                                {step.icon}
                            </div>
                            <span className={`text-[10px] sm:text-xs mt-2 font-bold text-center w-16 sm:w-20 ${isActive ? 'text-emerald-600' : 'text-gray-400'
                                }`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Orders = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState(''); // NEW state
    const [hoverRating, setHoverRating] = useState(0);
    const [isEditingReview, setIsEditingReview] = useState(false); // Track if editing



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
    // Separate logic for Payment and Shipping badges
    const getPaymentStatusBadge = (status) => {
        const s = (status || 'pending').toLowerCase();
        const badges = {
            unpaid: {
                text: 'Belum Dibayar',
                color: 'bg-red-100 text-red-800 border border-red-200'
            },
            pending: {
                text: 'Menunggu Pembayaran',
                color: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            },
            paid: {
                text: 'Dibayar',
                color: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            },
            lunas: {
                text: 'Dibayar',
                color: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            },
            expired: {
                text: 'Kedaluwarsa',
                color: 'bg-gray-100 text-gray-800 border border-gray-200'
            },
            failed: {
                text: 'Gagal',
                color: 'bg-red-100 text-red-800 border border-red-200'
            },
            dibatalkan: {
                text: 'Dibatalkan',
                color: 'bg-red-100 text-red-800 border border-red-200'
            },
            cancelled: {
                text: 'Dibatalkan',
                color: 'bg-red-100 text-red-800 border border-red-200'
            }
        };

        return badges[s] || badges.pending;
    };

    const getShippingStatusBadge = (status) => {
        const badges = {
            pending: {
                text: 'Menunggu',
                color: 'bg-gray-100 text-gray-800 border border-gray-200'
            },
            processing: {
                text: 'Diproses',
                color: 'bg-blue-100 text-blue-800 border border-blue-200'
            },
            dikonfirmasi: {
                text: 'Dikonfirmasi',
                color: 'bg-blue-100 text-blue-800 border border-blue-200'
            },
            dikirim: {
                text: 'Dikirim',
                color: 'bg-purple-100 text-purple-800 border border-purple-200'
            },
            shipped: {
                text: 'Dikirim',
                color: 'bg-purple-100 text-purple-800 border border-purple-200'
            },
            completed: {
                text: 'Selesai',
                color: 'bg-green-100 text-green-800 border border-green-200'
            },
            selesai: {
                text: 'Selesai',
                color: 'bg-green-100 text-green-800 border border-green-200'
            },
            delivered: {
                text: 'Selesai',
                color: 'bg-green-100 text-green-800 border border-green-200'
            },
            dibatalkan: {
                text: 'Dibatalkan',
                color: 'bg-red-100 text-red-800 border border-red-200'
            },
            cancelled: {
                text: 'Dibatalkan',
                color: 'bg-red-100 text-red-800 border border-red-200'
            },
            returned: {
                text: 'Dikembalikan (Retur)',
                color: 'bg-orange-100 text-orange-800 border border-orange-200'
            }
        };

        return badges[status] || badges.pending;
    };

    const getDisplayStatus = (order) => {
        // Jika sudah dibatalkan, prioritaskan status pembatalan
        if (order.status_pembayaran === 'dibatalkan' || order.status_pengiriman === 'dibatalkan' ||
            order.status_pembayaran === 'cancelled' || order.status_pengiriman === 'cancelled') {
            return { type: 'payment', value: 'cancelled' };
        }

        // Prioritas utama adalah status pengiriman jika sudah diproses
        if (order.status_pengiriman && order.status_pengiriman !== 'pending') {
            return { type: 'shipping', value: order.status_pengiriman };
        }

        // Default ke status pembayaran
        return { type: 'payment', value: order.status_pembayaran || 'pending' };
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
                    status_pembayaran: 'cancelled',
                    status_pengiriman: 'cancelled',
                    updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

            if (updateError) {
                console.error('❌ Supabase Update Error:', updateError);
                throw new Error(updateError.message || JSON.stringify(updateError));
            }

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

    // ✅ Fungsi untuk menyelesaikan pesanan (Konfirmasi Pesanan Diterima)
    const handleReviewClick = async (order) => {
        setSelectedOrder(order);
        setReviewRating(0);
        setReviewComment('');
        setIsEditingReview(false);
        setShowReviewModal(true);

        try {
            // Check if review exists for this order
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('order_id', order.id)
                .eq('user_id', user.id)
                .limit(1);

            if (data && data.length > 0) {
                // Found existing review
                const review = data[0];
                setReviewRating(review.rating);
                setReviewComment(review.comment || '');
                setIsEditingReview(true);
            }
        } catch (error) {
            console.error('Error checking existing review:', error);
        }
    };

    const handleCompleteOrder = async (orderId) => {
        if (!window.confirm('Apakah Anda yakin sudah menerima pesanan ini dengan baik? Tindakan ini akan menyelesaikan transaksi.')) {
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('orders')
                .update({
                    status_pengiriman: 'delivered',
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (error) throw error;

            toast.success('Terima kasih! Pesanan telah selesai.');

            // ✅ Kirim notifikasi konfirmasi sukses
            try {
                await supabase.from('notifications').insert({
                    user_id: user.id,
                    type: 'shipping',
                    title: 'Pesanan Selesai 🎉',
                    message: `Terima kasih! Transaksi pesanan #${orderId} telah selesai.`,
                    order_id: orderId,
                    link: '/orders'
                });
            } catch (nErr) {
                console.warn('Gagal kirim notif konfirmasi:', nErr);
            }

            await fetchOrders();
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(null);
            }
        } catch (error) {
            console.error('Error completing order:', error);
            toast.error('Gagal menyelesaikan pesanan: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fungsi untuk handle upload file
    const handleFileUpload = (files) => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'video/quicktime'];

        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                toast.error(`File ${file.name} terlalu besar (max 10MB)`);
                return false;
            }
            if (!allowedTypes.includes(file.type)) {
                toast.error(`Format file ${file.name} tidak didukung`);
                return false;
            }
            return true;
        });

        setUploadedFiles(prev => [...prev, ...validFiles]);
    };

    // ✅ Fungsi untuk remove file
    const removeFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // ✅ Fungsi untuk upload files ke Supabase Storage
    const uploadFilesToSupabase = async () => {
        const uploadedUrls = [];

        for (const file of uploadedFiles) {
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `refund-proofs/${fileName}`;

                const { data, error } = await supabase.storage
                    .from('refund-proofs')
                    .upload(filePath, file);

                if (error) {
                    console.error('Upload error:', error);
                    throw error;
                }

                const { data: urlData } = supabase.storage
                    .from('refund-proofs')
                    .getPublicUrl(filePath);

                uploadedUrls.push(urlData.publicUrl);
            } catch (error) {
                console.error('Error uploading file:', error);
                toast.error(`Gagal upload ${file.name}: ${error.message}`);
                throw error;
            }
        }

        return uploadedUrls;
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
                        const displayInfo = getDisplayStatus(order);
                        const statusBadge = displayInfo.type === 'shipping'
                            ? getShippingStatusBadge(displayInfo.value)
                            : getPaymentStatusBadge(displayInfo.value);
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

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => fetchOrderDetail(order.id)}
                                        className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-300 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                                    >
                                        Lihat Detail
                                    </button>

                                    <button
                                        onClick={() => {
                                            const year = new Date(order.created_at).getFullYear();
                                            const id = order.id.toString().padStart(5, '0');
                                            navigate(`/track?id=GH-${year}-${id}`);
                                        }}
                                        className="px-6 py-3 rounded-lg text-sm font-semibold border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2"
                                    >
                                        <span>🚚</span> Lacak
                                    </button>

                                    {order.status_pembayaran === 'paid' && (
                                        <button
                                            onClick={() => navigate(`/invoice/${order.id}`)}
                                            className="px-4 py-3 border border-emerald-600 text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-all flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                            Invoice
                                        </button>
                                    )}

                                    {order.status_pembayaran === 'paid' && (
                                        <>
                                            {(order.status_pengiriman === 'delivered' || order.status_pengiriman === 'selesai' || order.status_pengiriman === 'completed') && (
                                                <>
                                                    <button
                                                        className="px-4 py-3 bg-yellow-500 text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 shadow-md transition-all"
                                                        onClick={() => handleReviewClick(order)}
                                                    >
                                                        {/* Check manually if reviewed? logic handled in click */}
                                                        Edit Ulasan
                                                    </button>
                                                    <button
                                                        className="px-4 py-3 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all"
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowRefundModal(true);
                                                        }}
                                                    >
                                                        Retur
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}

                                    {order.status_pembayaran === 'paid' && (order.status_pengiriman === 'shipped' || order.status_pengiriman === 'dikirim') && (
                                        <button
                                            onClick={() => handleCompleteOrder(order.id)}
                                            disabled={loading}
                                            className="px-6 py-3 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
                                        >
                                            Pesanan Diterima
                                        </button>
                                    )}

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
                {selectedOrder && !showReviewModal && !showRefundModal && (
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
                                {/* Status Tracking Timeline */}
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                    <div className="flex justify-between items-center mb-2 px-2">
                                        <h3 className="text-sm font-bold text-gray-700">Pelacakan Pesanan</h3>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-mono flex items-center gap-2 border border-emerald-200 shadow-sm">
                                            <span className="opacity-70">ID TRACK:</span>
                                            <span className="font-bold uppercase">
                                                {`GH-${new Date(selectedOrder.created_at).getFullYear()}-${(selectedOrder.id).toString().padStart(5, '0')}`}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`GH-${new Date(selectedOrder.created_at).getFullYear()}-${(selectedOrder.id).toString().padStart(5, '0')}`);
                                                    toast.success('ID Lacak disalin!');
                                                }}
                                                className="hover:text-emerald-900 transition-colors ml-1"
                                                title="Salin ID"
                                            >
                                                📋
                                            </button>
                                        </span>
                                    </div>
                                    <TrackingTimeline status={selectedOrder.status_pengiriman} />
                                </div>

                                {/* Status Section */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <span className="text-sm font-medium text-gray-600">
                                            Status Pembayaran
                                        </span>
                                        <span className={`text-sm font-semibold px-3 py-2 rounded-full block text-center transition-colors duration-300 ${getPaymentStatusBadge(selectedOrder.status_pembayaran).color
                                            }`}>
                                            {getPaymentStatusBadge(selectedOrder.status_pembayaran).text}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-sm font-medium text-gray-600">
                                            Status Pengiriman
                                        </span>
                                        <span className={`text-sm font-semibold px-3 py-2 rounded-full block text-center transition-colors duration-300 ${getShippingStatusBadge(selectedOrder.status_pengiriman).color
                                            }`}>
                                            {getShippingStatusBadge(selectedOrder.status_pengiriman).text}
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

                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => navigate(`/invoice/${selectedOrder.id}`)}
                                        className="py-3 rounded-lg text-emerald-600 border border-emerald-600 font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Cetak Invoice
                                    </button>

                                    {canCancelOrder(selectedOrder) && (
                                        <button
                                            onClick={() => handleCancelOrder(selectedOrder)}
                                            disabled={loading}
                                            className="py-3 rounded-lg text-white bg-red-600 font-bold hover:bg-red-700 transition-all"
                                        >
                                            {loading ? 'Membatalkan...' : 'Batalkan Pesanan'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Modal */}
                {showReviewModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                            <h2 className="text-xl font-bold mb-4 text-gray-900">Beri Ulasan Produk</h2>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                // const comment = formData.get('comment'); // Use state instead

                                try {
                                    setIsSubmitting(true);

                                    if (reviewRating === 0) {
                                        toast.error('Harap pilih rating bintang');
                                        return;
                                    }

                                    // Delete existing reviews for this order if editing (simplest way to update all items)
                                    // OR use upsert. Since we loop items, let's delete first to be safe or upsert each.
                                    // Upsert requires conflict constraint. Safe bet: Delete all for order then Insert.

                                    // Strategy: Delete all reviews for this order by this user, then re-insert.
                                    // This ensures clean slate for all items in the order.
                                    if (isEditingReview) {
                                        await supabase.from('reviews').delete().match({ order_id: selectedOrder.id, user_id: user.id });
                                    }

                                    for (const item of selectedOrder.order_items) {
                                        const { error } = await supabase.from('reviews').insert({
                                            user_id: user.id,
                                            product_id: item.product_id,
                                            order_id: selectedOrder.id,
                                            rating: reviewRating,
                                            comment: reviewComment
                                        });
                                        if (error) throw error;
                                    }
                                    toast.success(isEditingReview ? 'Ulasan berhasil diperbarui!' : 'Terima kasih atas ulasannya!');
                                    setShowReviewModal(false);
                                    setSelectedOrder(null);
                                    setReviewRating(0);
                                    setReviewComment('');
                                } catch (error) {
                                    console.error('Error submitting review:', error);
                                    toast.error('Gagal mengirim ulasan');
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-3 text-center text-gray-700">Rating Produk</label>
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button
                                                key={num}
                                                type="button"
                                                onMouseEnter={() => setHoverRating(num)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setReviewRating(num)}
                                                className="transition-all duration-200 transform hover:scale-125 focus:outline-none"
                                            >
                                                <span className={`text-5xl transition-all duration-300 ${(hoverRating || reviewRating) >= num
                                                    ? 'text-yellow-400 drop-shadow-md'
                                                    : 'text-gray-300'
                                                    }`}>
                                                    ★
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    {reviewRating > 0 && (
                                        <p className="text-center text-sm font-semibold mt-2 text-emerald-600 animate-pulse">
                                            {reviewRating === 1 && 'Sangat Buruk 😞'}
                                            {reviewRating === 2 && 'Buruk 😕'}
                                            {reviewRating === 3 && 'Cukup OK 🙂'}
                                            {reviewRating === 4 && 'Bagus! 😊'}
                                            {reviewRating === 5 && 'Sangat Puas! 😍'}
                                        </p>
                                    )}
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Komentar</label>
                                    <textarea
                                        name="comment"
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl p-3 h-32 focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-800"
                                        placeholder="Apa pendapatmu tentang produk ini? (Opsional)"
                                    ></textarea>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowReviewModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all">Batal</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all">
                                        {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Refund Modal */}
                {showRefundModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Ajukan Pengembalian Dana
                                </h2>
                                <button onClick={() => {
                                    setShowRefundModal(false);
                                    setUploadedFiles([]);
                                }} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-6">
                                <p className="text-xs text-red-600 leading-relaxed font-medium">
                                    ⚠️ Pastikan Anda memiliki bukti foto/video barang yang tidak sesuai. Upload minimal 1 file bukti.
                                </p>
                            </div>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                const reason = formData.get('reason');

                                if (uploadedFiles.length === 0) {
                                    toast.error('Harap upload minimal 1 foto/video bukti');
                                    return;
                                }

                                try {
                                    setIsSubmitting(true);
                                    toast.info('Mengupload file bukti...');

                                    const fileUrls = await uploadFilesToSupabase();

                                    const { error } = await supabase.from('refunds').insert({
                                        user_id: user.id,
                                        order_id: selectedOrder.id,
                                        reason,
                                        proof_image_url: fileUrls.join(','),
                                        status: 'pending'
                                    });

                                    if (error) throw error;

                                    toast.success('Pengajuan refund berhasil dengan bukti!');
                                    setShowRefundModal(false);
                                    setSelectedOrder(null);
                                    setUploadedFiles([]);
                                } catch (error) {
                                    console.error('Error:', error);
                                    toast.error('Gagal mengajukan refund: ' + error.message);
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2 text-gray-700">
                                        Alasan Pengembalian <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="reason"
                                        className="w-full border border-gray-200 rounded-xl p-3 h-32 focus:ring-2 focus:ring-red-500 transition-all outline-none text-gray-800"
                                        placeholder="Jelaskan secara detail ketidaksesuaian barang..."
                                        required
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2 text-gray-700">
                                        Upload Bukti (Foto/Video) <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-500 transition-all cursor-pointer bg-gray-50"
                                        onClick={() => document.getElementById('fileInput').click()}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const files = Array.from(e.dataTransfer.files);
                                            handleFileUpload(files);
                                        }}
                                    >
                                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-sm text-gray-600 font-medium">Klik atau drag file ke sini</p>
                                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, MP4, MOV (Max 10MB)</p>
                                        <input
                                            id="fileInput"
                                            type="file"
                                            className="hidden"
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                                        />
                                    </div>

                                    {uploadedFiles.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            {uploadedFiles.map((file, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                                                    <div className="flex-shrink-0">
                                                        {file.type.startsWith('image/') ? (
                                                            <img src={URL.createObjectURL(file)} alt="preview" className="w-12 h-12 rounded object-cover" />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                                                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
                                                    >
                                                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowRefundModal(false);
                                            setUploadedFiles([]);
                                        }}
                                        className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || uploadedFiles.length === 0}
                                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Mengajukan...' : 'Kirim Pengajuan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;