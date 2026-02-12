import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatCurrency';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const timeLabels = {
    today: "Hari Ini",
    week: "7 Hari Terakhir",
    month: "Bulan Ini",
    last_month: "Bulan Lalu",
    year: "Tahun Ini",
    all: "Semua Waktu",
    custom: "Rentang Kustom"
};

const AdminAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month'); // Default to 'month'
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [analytics, setAnalytics] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        revenuePrevious: 0, // For comparison
        ordersPrevious: 0,
        topProducts: [],
        leastProducts: [],
        topCities: [],
        trendData: [],
        rawOrders: [] // Initialize as empty array
    });

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange, customStartDate, customEndDate]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // 1. Fetch ALL orders
            const { data: allOrders, error: ordersError } = await supabaseAdmin
                .from('orders')
                .select('*')
                .order('created_at', { ascending: true });

            if (ordersError) throw ordersError;

            const paidOrders = allOrders.filter(o => o.status_pembayaran?.toLowerCase() === 'paid');

            // --- DATE CALCULATION ---
            const now = new Date();
            let startDate, endDate, prevStartDate, prevEndDate, trendDays = 15;

            switch (timeRange) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    endDate = new Date(now.setHours(23, 59, 59, 999));
                    prevStartDate = new Date(startDate);
                    prevStartDate.setDate(prevStartDate.getDate() - 1);
                    prevEndDate = new Date(endDate);
                    prevEndDate.setDate(prevEndDate.getDate() - 1);
                    trendDays = 1;
                    break;
                case 'week':
                    startDate = new Date();
                    startDate.setDate(now.getDate() - 7);
                    endDate = new Date();
                    prevStartDate = new Date(startDate);
                    prevStartDate.setDate(prevStartDate.getDate() - 7);
                    prevEndDate = new Date(startDate);
                    trendDays = 7;
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date();
                    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
                    trendDays = 30;
                    break;
                case 'last_month':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                    prevEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
                    trendDays = 30;
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date();
                    prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
                    prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
                    trendDays = 365;
                    break;
                case 'custom':
                    startDate = new Date(customStartDate);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(customEndDate);
                    endDate.setHours(23, 59, 59, 999);
                    prevStartDate = null; // Comparison is tricky for custom ranges
                    // Calculate days between start and end
                    const diffTime = Math.abs(endDate - startDate);
                    trendDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (trendDays === 0) trendDays = 1;
                    break;
                default: // 'all'
                    startDate = new Date(0);
                    endDate = new Date();
                    prevStartDate = null;
                    trendDays = 30;
            }

            const filteredOrders = paidOrders.filter(o => {
                const d = new Date(o.created_at);
                return d >= startDate && d <= endDate;
            });

            const totalRevenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.total_harga || 0), 0);
            const totalOrders = filteredOrders.length;

            // Comparison data
            let revenuePrevious = 0;
            let ordersPrevious = 0;
            if (prevStartDate) {
                const prevOrders = paidOrders.filter(o => {
                    const d = new Date(o.created_at);
                    return d >= prevStartDate && d <= prevEndDate;
                });
                revenuePrevious = prevOrders.reduce((sum, o) => sum + parseFloat(o.total_harga || 0), 0);
                ordersPrevious = prevOrders.length;
            }

            // --- SALES TREND ---
            const trendData = [];
            const dayLimit = timeRange === 'year' ? 12 : (timeRange === 'all' ? 12 : trendDays);

            if (timeRange === 'year' || timeRange === 'all') {
                // Monthly trend for year/all
                for (let i = dayLimit - 1; i >= 0; i--) {
                    const d = new Date();
                    if (timeRange === 'year') {
                        d.setMonth(now.getMonth() - i);
                    } else {
                        d.setMonth(now.getMonth() - i);
                    }
                    const month = d.getMonth();
                    const year = d.getFullYear();
                    const displayDate = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

                    const monthRevenue = paidOrders
                        .filter(o => {
                            const od = new Date(o.created_at);
                            return od.getMonth() === month && od.getFullYear() === year;
                        })
                        .reduce((sum, o) => sum + parseFloat(o.total_harga || 0), 0);

                    trendData.push({ name: displayDate, omzet: monthRevenue });
                }
            } else {
                // Daily trend
                for (let i = trendDays - 1; i >= 0; i--) {
                    const d = new Date(endDate);
                    d.setDate(d.getDate() - i);
                    const isoDate = d.toISOString().split('T')[0];
                    const displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

                    const dayRevenue = paidOrders
                        .filter(o => o.created_at.startsWith(isoDate))
                        .reduce((sum, o) => sum + parseFloat(o.total_harga || 0), 0);

                    trendData.push({ name: displayDate, omzet: dayRevenue });
                }
            }

            // --- PRODUCT ANALYTICS (Filtered by Range) ---
            const { data: orderItems, error: itemsError } = await supabaseAdmin
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
                const orderDate = new Date(item.orders?.created_at);
                const isPaid = item.orders?.status_pembayaran === 'paid';
                const isInRange = orderDate >= startDate && orderDate <= endDate;

                if (isInRange) {
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
                }
            });

            const productSalesArray = Object.values(productSales);
            const topProducts = productSalesArray.sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 5);
            const leastProducts = productSalesArray.sort((a, b) => a.total_quantity - b.total_quantity).slice(0, 5);

            // --- CITY ANALYTICS (Filtered by Range) ---
            const citySales = {};
            filteredOrders.filter(o => o.kota).forEach(order => {
                // Normalize city name to Title Case
                const rawCity = order.kota.trim().toLowerCase();
                const city = rawCity.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

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
                totalRevenue,
                totalOrders,
                revenuePrevious,
                ordersPrevious,
                topProducts,
                leastProducts,
                topCities,
                trendData,
                rawOrders: filteredOrders
            });

        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Gagal memuat data analitik');
        } finally {
            setLoading(false);
        }
    };

    const handlePresetChange = (range) => {
        try {
            const now = new Date();
            let s, e;
            switch (range) {
                case 'today':
                    s = new Date(now.setHours(0, 0, 0, 0));
                    e = new Date(now.setHours(23, 59, 59, 999));
                    break;
                case 'week':
                    s = new Date();
                    s.setDate(now.getDate() - 7);
                    e = new Date();
                    break;
                case 'month':
                    s = new Date(now.getFullYear(), now.getMonth(), 1);
                    e = new Date();
                    break;
                case 'last_month':
                    s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    e = new Date(now.getFullYear(), now.getMonth(), 0);
                    break;
                case 'year':
                    s = new Date(now.getFullYear(), 0, 1);
                    e = new Date();
                    break;
                case 'all':
                    s = new Date(0);
                    e = new Date();
                    break;
                default:
                    return;
            }
            setCustomStartDate(s.toISOString().split('T')[0]);
            setCustomEndDate(e.toISOString().split('T')[0]);
            setTimeRange(range);
        } catch (error) {
            console.error("Error setting preset:", error);
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
            doc.text(`Ringkasan Performa (${timeLabels[timeRange]}):`, 20, 45);

            doc.setFontSize(11);
            doc.text(`- Total Omzet: ${formatCurrency(analytics.totalRevenue)}`, 25, 55);
            doc.text(`- Total Pesanan: ${analytics.totalOrders}`, 25, 62);
            doc.text(`- Periode: ${timeLabels[timeRange]}`, 25, 69);

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

            doc.save(`Laporan_GreenHouse_${timeRange}_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Laporan berhasil didownload!');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Gagal membuat laporan PDF');
        }
    };

    const exportToExcel = () => {
        try {
            const now = new Date().toLocaleString('id-ID');

            // 1. Prepare Data for Excel
            const dataToExport = analytics.rawOrders.map(order => ({
                'Tanggal': new Date(order.created_at).toLocaleDateString('id-ID'),
                'ID Pesanan': order.id,
                'Pembeli': order.customer_name || order.customer_email,
                'Total Harga': parseFloat(order.total_harga || 0),
                'Status Pembayaran': order.status_pembayaran === 'paid' ? 'LUNAS' : order.status_pembayaran,
                'Status Pengiriman': order.status_pengiriman,
                'Metode Bayar': order.payment_name || '-'
            }));

            // 2. Create Workbook and Worksheet
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");

            // 3. Save File
            XLSX.writeFile(workbook, `Laporan_GreenHouse_${timeRange}_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Laporan Excel berhasil didownload!');
        } catch (error) {
            console.error('Export Excel error:', error);
            toast.error('Gagal export ke Excel');
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
                </div>
                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    {/* Presets Dropdown */}
                    <div className="flex items-center gap-2 px-3 border-r border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Cepat:</span>
                        <select
                            value={timeLabels[timeRange] ? timeRange : 'custom'}
                            onChange={(e) => handlePresetChange(e.target.value)}
                            className="bg-transparent text-gray-700 text-sm font-bold outline-none cursor-pointer hover:text-green-600 transition-colors"
                        >
                            <option value="today">Hari Ini</option>
                            <option value="week">7 Hari</option>
                            <option value="month">Bulan Ini</option>
                            <option value="last_month">Bulan Lalu</option>
                            <option value="year">Tahun Ini</option>
                            <option value="all">Semua</option>
                            <option value="custom">Kustom</option>
                        </select>
                    </div>

                    {/* Date Pickers */}
                    <div className="flex items-center gap-4 px-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Dari:</span>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => {
                                    setCustomStartDate(e.target.value);
                                    setTimeRange('custom');
                                }}
                                className="text-sm text-gray-700 font-semibold outline-none cursor-pointer bg-green-50/50 px-2 py-1 rounded-lg hover:bg-green-100 transition-colors"
                            />
                        </div>
                        <div className="text-gray-300">→</div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Sampai:</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => {
                                    setCustomEndDate(e.target.value);
                                    setTimeRange('custom');
                                }}
                                className="text-sm text-gray-700 font-semibold outline-none cursor-pointer bg-green-50/50 px-2 py-1 rounded-lg hover:bg-green-100 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="ml-auto flex gap-2">
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition shadow-md shadow-emerald-100 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel
                        </button>
                        <button
                            onClick={exportToPDF}
                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 transition shadow-md shadow-red-100 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <h3 className="text-sm font-medium text-green-800">Total Omzet ({timeLabels[timeRange]})</h3>
                        <span className="text-2xl">💰</span>
                    </div>
                    <div className="space-y-1 text-green-900 relative z-10">
                        <p className="text-3xl font-extrabold">{formatCurrency(analytics.totalRevenue)}</p>
                        {timeRange !== 'all' && (
                            <p className={`text-xs font-semibold ${analytics.totalRevenue >= analytics.revenuePrevious ? 'text-green-600' : 'text-orange-600'}`}>
                                {analytics.totalRevenue >= analytics.revenuePrevious ? '↑' : '↓'} {formatCurrency(Math.abs(analytics.totalRevenue - analytics.revenuePrevious))} vs periode sebelumnya
                            </p>
                        )}
                    </div>
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-green-200/30 rounded-full blur-2xl"></div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <h3 className="text-sm font-medium text-blue-800">Jumlah Pesanan ({timeLabels[timeRange]})</h3>
                        <span className="text-2xl">📦</span>
                    </div>
                    <div className="space-y-1 text-blue-900 relative z-10">
                        <p className="text-3xl font-extrabold">{analytics.totalOrders} <span className="text-xl font-bold opacity-60">Pesanan</span></p>
                        {timeRange !== 'all' && (
                            <p className={`text-xs font-semibold ${analytics.totalOrders >= analytics.ordersPrevious ? 'text-blue-600' : 'text-orange-600'}`}>
                                {analytics.totalOrders >= analytics.ordersPrevious ? '↑' : '↓'} {Math.abs(analytics.totalOrders - analytics.ordersPrevious)} pesanan vs periode sebelumnya
                            </p>
                        )}
                    </div>
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-200/30 rounded-full blur-2xl"></div>
                </div>
            </div>

            {/* Sales Trend Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span>📈</span> Tren Omzet (
                    {timeRange === 'year' || timeRange === 'all'
                        ? '12 Bulan Terakhir'
                        : (timeRange === 'custom'
                            ? `${new Date(customStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${new Date(customEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
                            : (timeRange === 'today' ? '24 Jam Terakhir' : (timeRange === 'week' ? '7 Hari Terakhir' : '30 Hari Terakhir')))
                    })
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
