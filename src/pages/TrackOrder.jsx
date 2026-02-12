import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

const getEtaDescription = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (['selesai', 'delivered', 'completed', 'terkirim', 'diterima'].includes(s)) {
        return 'Pesanan Telah Tiba';
    }
    if (['shipped', 'dikirim', 'dalam perjalanan'].includes(s)) {
        return 'Hari Ini (Dalam Perjalanan)';
    }
    if (['processing', 'diproses', 'dikemas'].includes(s)) {
        return '1-2 Hari Kerja';
    }
    return 'Menunggu Jadwal Kurir';
};

const getStatusText = (status) => {
    const s = (status || 'pending').toLowerCase();
    const labels = {
        pending: 'Menunggu',
        processing: 'Diproses',
        shipped: 'Dikirim',
        delivered: 'Sampai',
        selesai: 'Selesai',
        dikirim: 'Dikirim',
        diproses: 'Diproses',
        dikemas: 'Dikemas'
    };
    return labels[s] || s.charAt(0).toUpperCase() + s.slice(1);
};

const TrackingTimeline = ({ status }) => {
    const steps = [
        { id: 'pending', label: 'Pesanan Dibuat', icon: '📝' },
        { id: 'processing', label: 'Diproses', icon: '📦' },
        { id: 'shipped', label: 'Dalam Perjalanan', icon: '🚚' },
        { id: 'delivered', label: 'Sampai Tujuan', icon: '✅' }
    ];

    const currentIdx = steps.findIndex(s => s.id === (status || 'pending').toLowerCase()) === -1
        ? (status?.toLowerCase() === 'selesai' || status?.toLowerCase() === 'completed' ? 3 : 0)
        : steps.findIndex(s => s.id === (status || 'pending').toLowerCase());

    return (
        <div className="py-10 px-2">
            <div className="relative flex justify-between items-center max-w-2xl mx-auto">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
                {/* Progress Bar Active */}
                <div
                    className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-1000 origin-left"
                    style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, idx) => {
                    const isActive = idx <= currentIdx;
                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-500 ${isActive ? 'bg-emerald-500 text-white scale-110 shadow-lg' : 'bg-white border-2 border-gray-300 text-gray-400'
                                }`}>
                                {step.icon}
                            </div>
                            <span className={`text-xs mt-3 font-bold text-center w-24 ${isActive ? 'text-emerald-600' : 'text-gray-400'
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

const TrackOrder = () => {
    const location = useLocation();
    const [trackId, setTrackId] = useState('');
    const [loading, setLoading] = useState(false);
    const [orderData, setOrderData] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const idParam = params.get('id');
        if (idParam) {
            setTrackId(idParam);
            performTracking(idParam);
        }
    }, [location]);

    const performTracking = async (idToTrack) => {
        if (!idToTrack) return;

        // Match format GH-YYYY-XXXXX
        const match = idToTrack.match(/GH-(\d{4})-(\d+)/i);
        if (!match) {
            toast.error('Format ID Lacak salah! Contoh: GH-2026-00021');
            return;
        }

        const orderId = parseInt(match[2]);

        try {
            setLoading(true);
            setOrderData(null);

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (error || !data) {
                toast.error('Pesanan tidak ditemukan!');
                return;
            }

            setOrderData(data);
            if (!location.search.includes('id=')) {
                toast.success('Pesanan ditemukan!');
            }
        } catch (error) {
            console.error('Error tracking order:', error);
            toast.error('Gagal melacak pesanan');
        } finally {
            setLoading(false);
        }
    };

    const handleTrack = (e) => {
        e.preventDefault();
        performTracking(trackId);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Lacak Pesanan</h1>
                    <p className="text-gray-600">Pantau perjalanan tanamanmu sampai ke pintu depan rumah.</p>
                </div>

                {/* Search Form */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 max-w-2xl mx-auto">
                    <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Masukkan ID Track (Contoh: GH-2026-00223)"
                                value={trackId}
                                onChange={(e) => setTrackId(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all uppercase font-mono tracking-wider"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {loading ? 'Ditunggu...' : 'Lacak Sekarang'}
                        </button>
                    </form>
                </div>

                {/* Result */}
                {orderData && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <p className="text-emerald-100 text-xs uppercase tracking-widest font-bold">Hasil Pelacakan</p>
                                <h2 className="text-2xl font-bold">{trackId.toUpperCase()}</h2>
                            </div>
                            <div className="text-right">
                                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                                    Status: {getStatusText(orderData.status_pengiriman)}
                                </span>
                            </div>
                        </div>

                        <div className="p-8">
                            <TrackingTimeline status={orderData.status_pengiriman} />

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-8">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                                        <span className="text-emerald-600">👤</span> Informasi Penerima
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 text-sm">
                                        <p className="flex justify-between">
                                            <span className="text-gray-500">Nama</span>
                                            <span className="font-semibold">{orderData.customer_name || 'Pembeli'}</span>
                                        </p>
                                        <p className="flex flex-col gap-1 mt-2">
                                            <span className="text-gray-500">Alamat Tujuan</span>
                                            <span className="font-semibold text-gray-800 leading-relaxed italic">
                                                {orderData.alamat_pengiriman || '-'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                                        <span className="text-emerald-600">🚛</span> Detail Layanan
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 text-sm">
                                        <p className="flex justify-between">
                                            <span className="text-gray-500">Metode Bayar</span>
                                            <span className="font-semibold uppercase">{orderData.metode_pembayaran || 'Default'}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="text-gray-500">Layanan</span>
                                            <span className="font-semibold">Kurir Toko (Express)</span>
                                        </p>
                                        <p className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                                            <span className="text-emerald-600 font-bold">Estimasi Tiba</span>
                                            <span className={`font-bold text-lg ${['selesai', 'delivered', 'completed'].includes(orderData.status_pengiriman?.toLowerCase())
                                                ? 'text-emerald-800' : 'text-emerald-600'
                                                }`}>
                                                {getEtaDescription(orderData.status_pengiriman)}
                                            </span>
                                        </p>
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

export default TrackOrder;
