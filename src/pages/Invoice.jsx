import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatCurrency';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import html2pdf from 'html2pdf.js';

const Invoice = () => {
    const { orderId } = useParams();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            fetchOrderDetail();
        } else if (isAuthenticated === false) {
            navigate('/login');
        }
    }, [orderId, isAuthenticated]);

    const fetchOrderDetail = async () => {
        try {
            setLoading(true);
            const idToFetch = Number(orderId);
            if (isNaN(idToFetch)) throw new Error('ID Pesanan tidak valid');

            console.log('🔄 Fetching Order ID:', idToFetch);

            // 1. Fetch Order Data
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', idToFetch)
                .single();

            if (orderError) {
                console.error('❌ Order Error:', orderError);
                throw orderError;
            }

            // 2. Fetch Customer Profile (Separate to avoid 400 join error)
            let profileData = null;
            if (orderData.user_id) {
                const { data: prof, error: profError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', orderData.user_id)
                    .single();

                if (!profError) {
                    profileData = prof;
                } else {
                    console.warn('⚠️ Profile Fetch Warning:', profError);
                }
            }

            // 3. Fetch Order Items (with fallback for join)
            let itemsData = [];
            const { data: itmFetch, error: itmError } = await supabase
                .from('order_items')
                .select('*, products(nama_produk)')
                .eq('order_id', idToFetch);

            if (itmError) {
                console.warn('⚠️ Primary Items Fetch failed, trying fallback without product join:', itmError);
                const { data: itmFallback, error: itmFallbackError } = await supabase
                    .from('order_items')
                    .select('*')
                    .eq('order_id', idToFetch);

                if (itmFallbackError) {
                    console.error('❌ Items Fallback Fetch also failed:', itmFallbackError);
                    throw itmFallbackError;
                }
                itemsData = itmFallback;
            } else {
                itemsData = itmFetch;
            }

            // Combine data
            setOrder({ ...orderData, profiles: profileData, items: itemsData });
            console.log('✅ Invoice Data Loaded Successfully');

        } catch (error) {
            console.error('❌ Full Fetch Error:', error);
            toast.error('Gagal memuat invoice: ' + (error.message || 'Error Server'));
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        const element = document.getElementById('invoice-content');
        const opt = {
            margin: 10,
            filename: `Invoice-GreenHouse-${order.order_number || order.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    if (loading) return <LoadingSpinner />;
    if (!order) return <div className="text-center py-20 font-bold text-gray-500">Invoice tidak ditemukan</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <style>
                {`
                    @media print {
                        @page {
                            margin: 0;
                            size: A4;
                        }
                        body {
                            background: white !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        .print\\:hidden {
                            display: none !important;
                        }
                        #invoice-content {
                            border: none !important;
                            box-shadow: none !important;
                            width: 100% !important;
                            max-width: none !important;
                            margin: 0 !important;
                            padding: 15mm !important;
                        }
                        .min-h-screen {
                            min-height: auto !important;
                        }
                    }
                `}
            </style>

            {/* Invoice Container */}
            <div className="max-w-4xl mx-auto border-t-8 border-emerald-600 p-8 md:p-12 shadow-2xl bg-white text-gray-900 overflow-hidden" id="invoice-content">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8 border-b border-gray-100 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">🌱</span>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
                                GREEN<span className="text-emerald-600">HOUSE</span>
                            </h1>
                        </div>
                        <p className="text-sm text-gray-500 font-medium tracking-wide">
                            SOLUSI TANAMAN HIAS & PERAWATAN
                        </p>
                    </div>

                    <div className="text-left md:text-right space-y-1">
                        <h2 className="text-3xl font-black text-gray-800 tracking-tight">INVOICE</h2>
                        <div className="bg-gray-900 text-white px-3 py-1 inline-block text-xs font-mono rounded">
                            #{order.order_number || order.id}
                        </div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest pt-2">
                            Tanggal: {new Date(order.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                        </p>
                    </div>
                </div>

                {/* Client & Status Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em]">Tujuan Pengiriman</h3>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-2">
                            <p className="text-xl font-black text-gray-900">{order.customer_name || order.profiles?.full_name}</p>
                            <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
                                {order.alamat_pengiriman}
                            </p>
                            <div className="pt-2 flex items-center gap-2 text-gray-500 text-xs font-mono">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {order.customer_phone || order.profiles?.phone}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 flex flex-col items-start md:items-end text-left md:text-right">
                        <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em]">Detail Pembayaran</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Status</p>
                                <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${order.status_pembayaran === 'paid'
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                    : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                    }`}>
                                    {order.status_pembayaran === 'paid' ? 'LUNAS (PAID)' : order.status_pembayaran}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Metode</p>
                                <p className="text-sm font-black text-gray-800">{order.metode_pembayaran?.toUpperCase() || 'TRIPAY GATEWAY'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table Section */}
                <div className="mb-12">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-4 border-gray-900 text-left">
                                <th className="py-5 text-xs font-black text-gray-900 uppercase tracking-widest">Item Pesanan</th>
                                <th className="py-5 text-xs font-black text-gray-900 uppercase tracking-widest text-center">Qty</th>
                                <th className="py-5 text-xs font-black text-gray-900 uppercase tracking-widest text-right">Harga</th>
                                <th className="py-5 text-xs font-black text-gray-900 uppercase tracking-widest text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {order.items?.map((item, index) => (
                                <tr key={index} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-6 pr-4">
                                        <p className="text-sm font-black text-gray-900">{item.products?.nama_produk || 'Produk'}</p>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Premium Hand-Picked</p>
                                    </td>
                                    <td className="py-6 text-sm text-gray-600 text-center font-mono">x {item.quantity}</td>
                                    <td className="py-6 text-sm text-gray-600 text-right font-mono">{formatCurrency(item.harga_satuan)}</td>
                                    <td className="py-6 text-sm font-black text-gray-900 text-right font-mono">{formatCurrency(item.quantity * item.harga_satuan)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary Section */}
                <div className="flex justify-end pt-8 border-t-2 border-gray-900">
                    <div className="w-full md:w-80 space-y-4">
                        <div className="flex justify-between text-sm text-gray-500 font-bold">
                            <span className="uppercase tracking-widest">Subtotal</span>
                            <span className="font-mono text-gray-900">{formatCurrency(order.total_harga)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500 font-bold pb-2">
                            <span className="uppercase tracking-widest">Shipping Fee</span>
                            <span className="font-mono text-gray-900">{formatCurrency(order.biaya_pengiriman)}</span>
                        </div>
                        <div className="bg-gray-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-2xl shadow-gray-900/20">
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Grand Total</span>
                            <span className="text-2xl font-black font-mono">{formatCurrency(order.total_harga + order.biaya_pengiriman)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-20 pt-10 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Kebijakan Garansi</h4>
                            <p className="text-[9px] text-gray-400 leading-relaxed font-medium uppercase tracking-tight">
                                1. Wajib melampirkan file PDF invoice ini untuk klaim refund. <br />
                                2. Sertakan video unboxing utuh tanpa cut (Max 48 jam). <br />
                                3. Garansi tidak berlaku jika kerusakan akibat kelalaian kurir.
                            </p>
                        </div>
                        <div className="flex flex-col items-start md:items-end justify-end space-y-2 opacity-30">
                            <p className="text-[10px] font-black text-gray-900">GREEN HOUSE OFFICIAL</p>
                            <p className="text-[8px] font-mono text-gray-500">Document Generated: {new Date().toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Float Actions */}
            <div className="max-w-4xl mx-auto mt-12 mb-20 flex flex-wrap gap-4 print:hidden justify-center scale-90 md:scale-100">
                <button
                    onClick={() => navigate('/orders')}
                    className="flex-1 min-w-[150px] py-4 px-8 rounded-2xl border-2 border-gray-200 text-gray-500 font-black hover:bg-white hover:border-gray-900 hover:text-gray-900 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Kembali
                </button>

                <button
                    onClick={handleDownload}
                    className="flex-1 min-w-[200px] py-4 px-8 rounded-2xl bg-gray-900 text-white font-black hover:bg-black shadow-2xl shadow-gray-900/30 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Download (PDF)
                </button>

                <button
                    onClick={handlePrint}
                    className="flex-1 min-w-[200px] py-4 px-8 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-2xl shadow-emerald-500/30 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Cetak Invoice
                </button>
            </div>
        </div>
    );
};

export default Invoice;
