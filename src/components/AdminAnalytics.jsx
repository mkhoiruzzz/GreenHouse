import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatCurrency';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState({
        totalRevenue: { daily: 0, monthly: 0 },
        totalOrders: { daily: 0, monthly: 0 },
        topProducts: [],
        leastProducts: [],
        topCities: [],
        trendData: []
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // 1. Fetch ALL orders
            const { data: allOrders, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: true });

            if (ordersError) throw ordersError;

            const paidOrders = allOrders.filter(o => o.status_pembayaran?.toLowerCase() === 'paid');

            // --- DATE CALCULATION ---
            const now = new Date();
            const todayISO = now.toISOString().split('T')[0];
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Daily/Monthly Revenue
            const dailyRevenue = paidOrders
                .filter(o => o.created_at.startsWith(todayISO))
                .reduce((sum, o) => sum + parseFloat(o.total_harga || 0), 0);

            const monthlyRevenue = paidOrders
                .filter(o => new Date(o.created_at) >= new Date(monthStart))
                .reduce((sum, o) => sum + parseFloat(o.total_harga || 0), 0);

            // --- SALES TREND (Last 15 Days) ---
            const trendData = [];
            for (let i = 14; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const isoDate = d.toISOString().split('T')[0];
                const displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

                const dayRevenue = paidOrders
                    .filter(o => o.created_at.startsWith(isoDate))
                    .reduce((sum, o) => sum + parseFloat(o.total_harga || 0), 0);

                trendData.push({
                    name: displayDate,
                    omzet: dayRevenue
                });
            }

            // --- PRODUCT ANALYTICS ---
            const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select(`
                  *,
                  products (nama_produk, gambar_url),
                  orders!inner (*)
                `);

            if (itemsError) throw itemsError;

            const productSales = {};
            orderItems.forEach(item => {
                const productId = item.product_id;
                const isPaid = item.orders?.status_pembayaran === 'paid';

                if (!productSales[productId]) {
                    productSales[productId] = {
                        product_id: productId,
                        nama_produk: item.products?.nama_produk || 'Tidak Diketahui',
                        gambar_url: item.products?.gambar_url,
                        total_quantity: 0,
                        total_revenue: 0
                    };
                }
                productSales[productId].total_quantity += item.quantity;
                if (isPaid) {
                    productSales[productId].total_revenue += item.quantity * parseFloat(item.harga_satuan || 0);
                }
            });

            const productSalesArray = Object.values(productSales);
            const topProducts = productSalesArray.sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 5);
            const leastProducts = productSalesArray.sort((a, b) => a.total_quantity - b.total_quantity).slice(0, 5);

            // --- CITY ANALYTICS ---
            const citySales = {};
            allOrders.filter(o => o.kota).forEach(order => {
                const city = order.kota.trim();
                const isPaid = order.status_pembayaran === 'paid';

                if (!citySales[city]) {
                    citySales[city] = { city, total_orders: 0, total_revenue: 0 };
                }
                citySales[city].total_orders += 1;
                if (isPaid) {
                    citySales[city].total_revenue += parseFloat(order.total_harga || 0);
                }
            });

            const topCities = Object.values(citySales).sort((a, b) => b.total_orders - a.total_orders).slice(0, 5);

            setAnalytics({
                totalRevenue: { daily: dailyRevenue, monthly: monthlyRevenue },
                totalOrders: { daily: paidOrders.filter(o => o.created_at.startsWith(todayISO)).length, monthly: paidOrders.filter(o => new Date(o.created_at) >= new Date(monthStart)).length },
                topProducts,
                leastProducts,
                topCities,
                trendData,
                rawOrders: allOrders // Useful for PDF export
            });

        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Gagal memuat data analitik');
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            const now = new Date().toLocaleString('id-ID');

            // Header
            doc.setFontSize(22);
            doc.setTextColor(22, 163, 74); // Green-600
            doc.text('GREEN HOUSE - LAPORAN PENJUALAN', 105, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Dicetak pada: ${now}`, 105, 28, { align: 'center' });

            // Summary Info
            doc.setDrawColor(200);
            doc.line(20, 35, 190, 35);

            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text('Ringkasan Performa:', 20, 45);

            doc.setFontSize(11);
            doc.text(`- Omzet Hari Ini: ${formatCurrency(analytics.totalRevenue.daily)}`, 25, 55);
            doc.text(`- Omzet Bulan Ini: ${formatCurrency(analytics.totalRevenue.monthly)}`, 25, 62);
            doc.text(`- Total Pesanan Terdaftar: ${analytics.rawOrders.length}`, 25, 69);

            // Table Header
            doc.setFontSize(14);
            doc.text('Daftar Penjualan Terbaru:', 20, 85);

            // Prepare Table Data
            const tableData = analytics.rawOrders.slice(-20).map(order => [
                new Date(order.created_at).toLocaleDateString('id-ID'),
                order.payment_name || '-',
                order.customer_name || order.customer_email,
                order.status_pembayaran === 'paid' ? 'SUDAH BAYAR' : (order.status_pembayaran === 'unpaid' ? 'BELUM BAYAR' : order.status_pembayaran.toUpperCase()),
                formatCurrency(order.total_harga)
            ]);

            autoTable(doc, {
                startY: 90,
                head: [['Tanggal', 'Metode', 'Pembeli', 'Status', 'Total']],
                body: tableData,
                headStyles: { fillColor: [22, 163, 74] },
                alternateRowStyles: { fillColor: [240, 253, 244] },
            });

            doc.save(`Laporan_GreenHouse_${todayISO()}.pdf`);
            toast.success('Laporan berhasil didownload!');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Gagal membuat laporan PDF');
        }
    };

    const todayISO = () => new Date().toISOString().split('T')[0];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header & Export Button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Analitik & Laporan</h2>
                    <p className="text-gray-500 text-sm">Monitor pertumbuhan bisnis Green House Anda</p>
                </div>
                <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-100"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Cetak Laporan (PDF)
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-green-800">Total Omzet</h3>
                        <span className="text-2xl">💰</span>
                    </div>
                    <div className="space-y-2 text-green-900">
                        <div>
                            <p className="text-xs opacity-70">Hari Ini</p>
                            <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue.daily)}</p>
                        </div>
                        <div className="border-t border-green-200 pt-2">
                            <p className="text-xs opacity-70">Bulan Ini</p>
                            <p className="text-xl font-bold">{formatCurrency(analytics.totalRevenue.monthly)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-blue-800">Jumlah Pesanan</h3>
                        <span className="text-2xl">📦</span>
                    </div>
                    <div className="space-y-2 text-blue-900">
                        <div>
                            <p className="text-xs opacity-70">Terbayar Hari Ini</p>
                            <p className="text-2xl font-bold">{analytics.totalOrders.daily} pesanan</p>
                        </div>
                        <div className="border-t border-blue-200 pt-2">
                            <p className="text-xs opacity-70">Bulan Ini</p>
                            <p className="text-xl font-bold">{analytics.totalOrders.monthly} pesanan</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sales Trend Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span>📈</span> Tren Omzet (15 Hari Terakhir)
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.trendData}>
                            <defs>
                                <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickFormatter={(value) => `Rp ${value / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => formatCurrency(value)}
                            />
                            <Area
                                type="monotone"
                                dataKey="omzet"
                                stroke="#16a34a"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorOmzet)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Best Sellers */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span>🏆</span> Produk Terlaris
                    </h3>
                    {analytics.topProducts.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Belum ada data penjualan</p>
                    ) : (
                        <div className="space-y-4">
                            {analytics.topProducts.map((product, idx) => (
                                <div key={product.product_id} className="flex items-center gap-4 group">
                                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center font-bold text-green-600 text-sm group-hover:bg-green-600 group-hover:text-white transition-colors">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">{product.nama_produk}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs text-gray-500">Terjual {product.total_quantity} unit</span>
                                            <span className="text-sm font-bold text-green-600">{formatCurrency(product.total_revenue)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
                                            <div
                                                className="bg-green-500 h-1.5 rounded-full"
                                                style={{ width: `${(product.total_quantity / analytics.topProducts[0].total_quantity) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Cities */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span>🏙️</span> Wilayah Pembeli
                    </h3>
                    {analytics.topCities.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Belum ada data wilayah</p>
                    ) : (
                        <div className="space-y-4">
                            {analytics.topCities.map((city, idx) => (
                                <div key={city.city} className="flex items-center gap-4">
                                    <div className="flex-1 px-4 py-3 bg-gray-50 rounded-xl">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-gray-800">{city.city}</span>
                                            <span className="text-sm font-bold text-blue-600">{city.total_orders} Pesanan</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 opacity-60">
                                            <span className="text-xs">Omzet Wilayah</span>
                                            <span className="text-xs">{formatCurrency(city.total_revenue)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
