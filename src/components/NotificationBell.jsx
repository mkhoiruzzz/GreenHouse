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

            // Listen for new notifications specifically for this user
            const channel = supabase
                .channel(`user-notifications-${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, (payload) => {
                    console.log('New notification received:', payload.new);
                    setNotifications(prev => [payload.new, ...prev].slice(0, 20));
                    setUnreadCount(prev => prev + 1);

                    // Show a small browser notification or toast if desired
                    if (Notification.permission === 'granted' && !isOpen) {
                        new Notification(payload.new.title, { body: payload.new.message });
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            // 1. Fetch persistent notifications from DB
            const { data: dbNotifs, error: dbError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (dbError) throw dbError;

            // 2. Fetch active vouchers (they are global, so we fetch them dynamically)
            const { data: vouchers, error: vouchersError } = await supabase
                .from('vouchers')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(5);

            if (vouchersError) throw vouchersError;

            // 3. Combine and transform
            const formattedDbNotifs = (dbNotifs || []).map(n => ({
                ...n,
                source: 'db'
            }));

            const formattedVouchers = (vouchers || []).map(v => ({
                id: `vouch-${v.id}`,
                user_id: user.id,
                type: 'voucher',
                title: 'Voucher Baru! 🏷️',
                message: `Gunakan kode ${v.code} untuk diskon ${v.discount_type === 'percentage' ? v.amount + '%' : 'Rp ' + v.amount.toLocaleString()}.`,
                link: '/products',
                is_read: false, // Will be calculated by timestamp
                created_at: v.created_at,
                source: 'voucher'
            }));

            const combined = [...formattedDbNotifs, ...formattedVouchers]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 20);

            const lastCheck = parseInt(localStorage.getItem('last_notif_check') || '0');

            // Calculate unread: DB is_read=false OR (Voucher and time > lastCheck)
            const unread = combined.filter(n => {
                if (n.source === 'db') return !n.is_read;
                if (n.source === 'voucher') return new Date(n.created_at).getTime() > lastCheck;
                return false;
            }).length;

            console.log('🔔 Combined Notifications:', combined.length, 'Unread:', unread);
            setNotifications(combined);
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleToggle = async () => {
        const nextIsOpen = !isOpen;
        setIsOpen(nextIsOpen);

        if (nextIsOpen && unreadCount > 0) {
            // Mark DB notifications as read
            try {
                const { error } = await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('user_id', user.id)
                    .eq('is_read', false);

                if (error) throw error;

                // Mark Vouchers as read locally
                localStorage.setItem('last_notif_check', Date.now().toString());

                setUnreadCount(0);
                // Update local state
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            } catch (error) {
                console.error('Error marking notifications as read:', error);
            }
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
                                        to={notif.link || '/orders'}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className={`flex-shrink-0 w-12 h-12 ${notif.type === 'payment' ? 'bg-emerald-100' :
                                            notif.type === 'shipping' ? 'bg-purple-100' :
                                                notif.type === 'refund' ? 'bg-red-100' :
                                                    'bg-blue-100'} rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                                            {notif.type === 'payment' ? '✅' :
                                                notif.type === 'shipping' ? '📦' :
                                                    notif.type === 'refund' ? '💰' :
                                                        '🔔'}
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
                                                {formatRelatif(new Date(notif.created_at))}
                                            </p>
                                        </div>
                                        {/* Status Dot */}
                                        {!notif.is_read && (
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
