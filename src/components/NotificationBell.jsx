import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Optional: Set up real-time subscription for orders
            const subscription = supabase
                .channel('orders-status-change')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${user.id}`
                }, () => {
                    fetchNotifications();
                })
                .subscribe();

            const refundSubscription = supabase
                .channel('refunds-status-change')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'refunds',
                    filter: `user_id=eq.${user.id}`
                }, () => {
                    fetchNotifications();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
                supabase.removeChannel(refundSubscription);
            };
        }
    }, [user]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            // 1. Fetch recent orders for payment & shipping updates
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('id, status_pembayaran, status_pengiriman, created_at, updated_at')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(10);

            if (ordersError) throw ordersError;

            if (vouchersError) throw vouchersError;

            // 3. Fetch recent refunds
            const { data: refunds, error: refundsError } = await supabase
                .from('refunds')
                .select('id, order_id, status, created_at, updated_at')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(5);

            if (refundsError) throw refundsError;

            // Combine and format
            const formattedNotifications = [];

            // Add payment notifications
            orders.forEach(order => {
                if (order.status_pembayaran === 'paid') {
                    formattedNotifications.push({
                        id: `pay-${order.id}`,
                        type: 'payment',
                        title: 'Pembayaran Berhasil',
                        message: `Pesanan #${order.id} telah berhasil dibayar.`,
                        time: new Date(order.updated_at),
                        link: `/orders`,
                        icon: '✅',
                        color: 'bg-emerald-100'
                    });
                }

                if (order.status_pengiriman !== 'pending') {
                    let title = 'Update Pengiriman';
                    let message = `Status pesanan #${order.id}: ${order.status_pengiriman}`;

                    if (order.status_pengiriman === 'shipped') {
                        title = 'Pesanan Dikirim 🚚';
                        message = `Pesanan #${order.id} sedang dalam perjalanan.`;
                    } else if (order.status_pengiriman === 'delivered') {
                        title = 'Pesanan Sampai ✅';
                        message = `Pesanan #${order.id} telah sampai di tujuan.`;
                    } else if (order.status_pengiriman === 'processing') {
                        title = 'Pesanan Diproses 📦';
                        message = `Pesanan #${order.id} sedang diproses penjual.`;
                    }

                    formattedNotifications.push({
                        id: `ship-${order.id}-${order.status_pengiriman}`,
                        type: 'shipping',
                        title: title,
                        message: message,
                        time: new Date(order.updated_at),
                        link: `/orders`,
                        icon: '📦',
                        color: 'bg-purple-100'
                    });
                }
            });

            // Add refund notifications
            refunds.forEach(refund => {
                if (refund.status !== 'pending') {
                    const isApproved = refund.status === 'approved';
                    formattedNotifications.push({
                        id: `refund-${refund.id}`,
                        type: 'refund',
                        title: isApproved ? 'Refund Disetujui ✅' : 'Refund Ditolak ❌',
                        message: isApproved
                            ? `Pengajuan refund pesanan #${refund.order_id} telah disetujui.`
                            : `Mohon maaf, pengajuan refund pesanan #${refund.order_id} ditolak.`,
                        time: new Date(refund.updated_at),
                        link: `/orders`,
                        icon: isApproved ? '💰' : '⚠️',
                        color: isApproved ? 'bg-green-100' : 'bg-red-100'
                    });
                }
            });

            // Add voucher notifications
            vouchers.forEach(v => {
                const discountText = v.discount_type === 'percentage' ? `${v.amount}%` : `Rp ${v.amount.toLocaleString()}`;
                formattedNotifications.push({
                    id: `vouch-${v.code}`,
                    type: 'voucher',
                    title: 'Voucher Baru! 🏷️',
                    message: `Gunakan kode ${v.code} untuk diskon ${discountText}.`,
                    time: new Date(v.created_at),
                    link: '/products',
                    icon: '🎁',
                    color: 'bg-orange-100'
                });
            });

            // Sort by time
            const sorted = formattedNotifications.sort((a, b) => b.time - a.time).slice(0, 15);
            setNotifications(sorted);

            // Calculate unread (simple mock: everything new since last check)
            const lastCheck = localStorage.getItem('last_notif_check') || 0;
            const unread = sorted.filter(n => n.time.getTime() > parseInt(lastCheck)).length;
            setUnreadCount(unread);

        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Mark all as read by updating last check time
            localStorage.setItem('last_notif_check', Date.now().toString());
            setUnreadCount(0);
        }
    };

    // ✅ Helper untuk format waktu relatif tanpa library eksternal
    const formatRelatif = (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Baru saja';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;

        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={handleToggle}
                className="relative p-2 text-white hover:text-yellow-300 transition-colors duration-200 focus:outline-none"
                aria-label="Notifications"
            >
                <div className="text-xl">🔔</div>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-green-600 animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all duration-300 animate-fade-in">
                    <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
                        <h3 className="font-bold text-lg">Notifikasi</h3>
                        {unreadCount > 0 && (
                            <span className="bg-white/20 text-xs px-2 py-1 rounded-full border border-white/30">
                                {unreadCount} baru
                            </span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center text-gray-500">
                                <div className="text-4xl mb-2">📭</div>
                                <p className="text-sm italic">Belum ada notifikasi baru</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <Link
                                        key={notif.id}
                                        to={notif.link}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className={`flex-shrink-0 w-12 h-12 ${notif.color} rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                                            {notif.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 text-sm mb-0.5">
                                                {notif.title}
                                            </p>
                                            <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formatRelatif(notif.time)}
                                            </p>
                                        </div>
                                        {/* Status Dot */}
                                        {notif.time.getTime() > parseInt(localStorage.getItem('last_notif_check') || 0) && (
                                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2"></div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t bg-gray-50 text-center">
                        <Link
                            to="/orders"
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors py-2"
                        >
                            Lihat Semua Pesanan →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
