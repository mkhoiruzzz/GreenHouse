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
                    setNotifications(prev => [payload.new, ...prev]);
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
        if (!user) return;
        try {
            // 1. Fetch persistent notifications from DB
            const { data: dbNotifs, error: dbError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(30);

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
                title: 'Voucher Baru! ',
                message: `Gunakan kode ${v.code} untuk diskon ${v.discount_type === 'percentage' ? v.amount + '%' : 'Rp ' + v.amount.toLocaleString()}.`,
                link: '/products',
                is_read: false, // Will be calculated by timestamp
                created_at: v.created_at,
                source: 'voucher'
            }));

            const combined = [...formattedDbNotifs, ...formattedVouchers]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            const lastCheck = parseInt(localStorage.getItem('last_notif_check') || '0');

            // Calculate unread: DB is_read=false OR (Voucher and time > lastCheck)
            const markedCombined = combined.map(n => {
                if (n.source === 'voucher') {
                    return { ...n, is_read: new Date(n.created_at).getTime() <= lastCheck };
                }
                return n;
            });

            const unread = markedCombined.filter(n => !n.is_read).length;

            console.log('🔔 Combined Notifications:', markedCombined.length, 'Unread:', unread);
            setNotifications(markedCombined);
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleMarkAllAsRead = async (e) => {
        if (e) e.stopPropagation();
        if (!user || unreadCount === 0) return;

        try {
            // Mark DB notifications as read
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
    };

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    // ✅ Helper untuk format waktu relatif tanpa library eksternal
    const formatRelatif = (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Baru saja';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}j`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}h`;

        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const unreadNotifs = notifications.filter(n => !n.is_read);
    const readNotifs = notifications.filter(n => n.is_read);

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
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-emerald-600 animate-bounce">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-[280px] sm:w-[320px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-emerald-100 z-[100] overflow-hidden transform origin-top-right transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-emerald-50/30">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm">🌿</span>
                            <h3 className="font-bold text-gray-800 text-sm">Notifikasi</h3>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center text-gray-400">
                                <div className="text-3xl mb-2 opacity-20">🍃</div>
                                <p className="text-xs font-medium">Kosong nih...</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {/* Unread Section */}
                                {unreadNotifs.length > 0 && (
                                    <div className="bg-white">
                                        <div className="px-4 py-1.5 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Baru</div>
                                        {unreadNotifs.map((notif) => (
                                            <NotificationItem key={notif.id} notif={notif} formatRelatif={formatRelatif} setIsOpen={setIsOpen} />
                                        ))}
                                    </div>
                                )}

                                {/* Read Section */}
                                {readNotifs.length > 0 && (
                                    <div className="bg-white">
                                        {(unreadNotifs.length > 0) && (
                                            <div className="px-4 py-1.5 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sebelumnya</div>
                                        )}
                                        {readNotifs.map((notif) => (
                                            <NotificationItem key={notif.id} notif={notif} formatRelatif={formatRelatif} setIsOpen={setIsOpen} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-emerald-50/10 border-t border-gray-50 space-y-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="w-full py-1.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg uppercase tracking-wider transition-colors border border-emerald-100/50"
                            >
                                Tandai Semua Sudah Dibaca
                            </button>
                        )}
                        <Link
                            to="/orders"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-center w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-md shadow-emerald-100 transition-all active:scale-95"
                        >
                            Lihat Semua Aktivitas
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

const NotificationItem = ({ notif, formatRelatif, setIsOpen }) => {
    const { isAdmin } = useAuth();

    // Determine the correct link based on user role and notification type
    let link = notif.link || '/orders';
    if (isAdmin && (notif.title || '').toLowerCase().includes('pesanan')) {
        link = '/admin?tab=orders';
    } else if (isAdmin && (notif.title || '').toLowerCase().includes('refund')) {
        link = '/admin?tab=refunds';
    }

    return (
        <Link
            to={link}
            onClick={() => setIsOpen(false)}
            className={`flex items-start gap-3 px-4 py-3 transition-all duration-200 border-l-2 hover:bg-emerald-50/30 ${notif.is_read ? 'border-transparent' : 'border-emerald-500 bg-emerald-50/40'}`}
        >
            {/* Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${notif.type === 'payment' ? '' :
                notif.type === 'shipping' ? '' :
                    notif.type === 'refund' ? '' :
                        notif.type === 'voucher' ? '' :
                            ''}`}>
                {notif.type === 'payment' ? '💳' :
                    notif.type === 'shipping' ? '🚚' :
                        notif.type === 'refund' ? '💰' :
                            notif.type === 'voucher' ? '🏷️' :
                                '🔔'}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <p className={`font-bold text-[11px] leading-tight truncate ${notif.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notif.title}
                    </p>
                    <span className="text-[9px] font-medium text-gray-400 shrink-0 ml-2">
                        {formatRelatif(new Date(notif.created_at))}
                    </span>
                </div>
                <p className={`text-[10px] leading-snug mt-0.5 line-clamp-2 ${notif.is_read ? 'text-gray-400' : 'text-gray-700'}`}>
                    {notif.message}
                </p>
            </div>
        </Link>
    );
};

export default NotificationBell;
