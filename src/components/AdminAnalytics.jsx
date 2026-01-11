import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatCurrency';

const AdminAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState({
        totalRevenue: { daily: 0, monthly: 0 },
        totalOrders: { daily: 0, monthly: 0 },
        topProducts: [],
        leastProducts: [],
        topCities: []
    });
    const [timeFilter, setTimeFilter] = useState('monthly'); // 'daily' or 'monthly'

    useEffect(() => {
        fetchAnalytics();
    }, [timeFilter]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // Calculate date ranges
            const now = new Date();
            const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // 1. Fetch ALL orders (to show activity even if unpaid)
            const { data: allOrders, error: ordersError } = await supabase
                .from('orders')
                .select('*');

            if (ordersError) throw ordersError;

            // Revenue: Only from PAID orders
            const paidOrders = allOrders.filter(o => o.status_pembayaran === 'paid');

            // Calculate daily revenue
            const dailyPaidOrders = paidOrders.filter(o => new Date(o.created_at) >= new Date(todayStart));
            const dailyRevenue = dailyPaidOrders.reduce((sum, o) => sum + parseFloat(o.total_harga || 0), 0);

            // Calculate monthly revenue
            const monthlyPaidOrders = paidOrders.filter(o => new Date(o.created_at) >= new Date(monthStart));
            const monthlyRevenue = monthlyPaidOrders.reduce((sum, o) => sum + parseFloat(o.total_harga || 0), 0);

            // 2. Fetch order items (all items to show popular products)
            const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select(`
                  *,
                  products (nama_produk, gambar_url),
                  orders!inner (*)
                `);

            if (itemsError) throw itemsError;

            // Group by product (all orders for "popularity", but track revenue only for paid)
            const productSales = {};
            orderItems.forEach(item => {
                const productId = item.product_id;
                const isPaid = item.orders?.status_pembayaran === 'paid';

                if (!productSales[productId]) {
                    productSales[productId] = {
                        product_id: productId,
                        nama_produk: item.products?.nama_produk || 'Unknown',
                        gambar_url: item.products?.gambar_url,
                        total_quantity: 0,
                        total_revenue: 0 // Track revenue only from paid orders
                    };
                }
                productSales[productId].total_quantity += item.quantity;
                if (isPaid) {
                    productSales[productId].total_revenue += item.quantity * parseFloat(item.harga_satuan || 0);
                }
            });

            const productSalesArray = Object.values(productSales);

            // Top 5 best sellers (by quantity sold/checkout)
            const topProducts = productSalesArray
                .sort((a, b) => b.total_quantity - a.total_quantity)
                .slice(0, 5);

            // Top 5 least sellers
            const leastProducts = productSalesArray
                .sort((a, b) => a.total_quantity - b.total_quantity)
                .slice(0, 5);

            // 3. Top Cities (dari semua orders yang ada kota)
            const cityOrders = allOrders.filter(o => o.kota);
            const citySales = {};
            cityOrders.forEach(order => {
                const city = order.kota.trim();
                const isPaid = order.status_pembayaran === 'paid';

                if (!citySales[city]) {
                    citySales[city] = {
                        city: city,
                        total_orders: 0,
                        total_revenue: 0 // Only paid revenue
                    };
                }
                citySales[city].total_orders += 1;
                if (isPaid) {
                    citySales[city].total_revenue += parseFloat(order.total_harga || 0);
                }
            });

            const topCities = Object.values(citySales)
                .sort((a, b) => b.total_orders - a.total_orders)
                .slice(0, 5);

            setAnalytics({
                totalRevenue: {
                    daily: dailyRevenue,
                    monthly: monthlyRevenue
                },
                totalOrders: {
                    daily: dailyPaidOrders.length,
                    monthly: monthlyPaidOrders.length,
                    all_daily: allOrders.filter(o => new Date(o.created_at) >= new Date(todayStart)).length
                },
                topProducts,
                leastProducts,
                topCities
            });

        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Gagal memuat data analitik');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-green-800">Total Omzet</h3>
                        <span className="text-2xl">💰</span>
                    </div>
                    <div className="space-y-2">
                        <div>
                            <p className="text-xs text-green-600">Hari Ini</p>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(analytics.totalRevenue.daily)}</p>
                        </div>
                        <div className="border-t border-green-200 pt-2">
                            <p className="text-xs text-green-600">Bulan Ini</p>
                            <p className="text-xl font-bold text-green-900">{formatCurrency(analytics.totalRevenue.monthly)}</p>
                        </div>
                    </div>
                </div>

                {/* Total Orders */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-blue-800">Jumlah Pesanan</h3>
                        <span className="text-2xl">📦</span>
                    </div>
                    <div className="space-y-2">
                        <div>
                            <p className="text-xs text-blue-600">Terbayar Hari Ini</p>
                            <p className="text-2xl font-bold text-blue-900">{analytics.totalOrders.daily} <span className="text-sm font-normal text-blue-500">/ {analytics.totalOrders.all_daily} (Total)</span></p>
                        </div>
                        <div className="border-t border-blue-200 pt-2">
                            <p className="text-xs text-blue-600">Bulan Ini (Terbayar)</p>
                            <p className="text-xl font-bold text-blue-900">{analytics.totalOrders.monthly} pesanan</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Best Sellers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🏆</span> Produk Terlaris
                </h3>
                {analytics.topProducts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Belum ada data penjualan</p>
                ) : (
                    <div className="space-y-3">
                        {analytics.topProducts.map((product, idx) => (
                            <div key={product.product_id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700">
                                    {idx + 1}
                                </div>
                                {product.gambar_url && (
                                    <img src={product.gambar_url} alt={product.nama_produk} className="w-12 h-12 object-cover rounded-lg" />
                                )}
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{product.nama_produk}</p>
                                    <p className="text-sm text-gray-600">Terjual: {product.total_quantity} unit</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">{formatCurrency(product.total_revenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Least Sellers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📉</span> Produk Jarang Dibeli
                </h3>
                {analytics.leastProducts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Belum ada data penjualan</p>
                ) : (
                    <div className="space-y-3">
                        {analytics.leastProducts.map((product) => (
                            <div key={product.product_id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                {product.gambar_url && (
                                    <img src={product.gambar_url} alt={product.nama_produk} className="w-12 h-12 object-cover rounded-lg" />
                                )}
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{product.nama_produk}</p>
                                    <p className="text-sm text-gray-600">Terjual: {product.total_quantity} unit</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-orange-600">{formatCurrency(product.total_revenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Top Cities */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🏙️</span> Kota Pembeli Terbanyak
                </h3>
                {analytics.topCities.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Belum ada data pesanan dengan kota</p>
                ) : (
                    <div className="space-y-3">
                        {analytics.topCities.map((city, idx) => (
                            <div key={city.city} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{city.city}</p>
                                    <p className="text-sm text-gray-600">{city.total_orders} pesanan</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-blue-600">{formatCurrency(city.total_revenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAnalytics;
