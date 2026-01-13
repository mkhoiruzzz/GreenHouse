import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { formatCurrency } from "../utils/formatCurrency";
import { toast } from "react-toastify";

const AdminOverview = ({ onSwitchTab }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        paidOrders: 0,
        totalUsers: 0,
        totalProducts: 0,
        lowStockProducts: [],
        recentOrders: [],
    });

    useEffect(() => {
        fetchOverviewData();
    }, []);

    const fetchOverviewData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Orders for Revenue and Recent Activities
            const { data: orders, error: ordersError } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (ordersError) throw ordersError;

            const paidOrders = orders.filter((o) => o.status_pembayaran === "paid");
            const totalRevenue = paidOrders.reduce(
                (sum, o) => sum + parseFloat(o.total_harga || 0),
                0
            );

            // 2. Fetch Users count
            const { count: usersCount, error: usersError } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true });

            if (usersError) throw usersError;

            // 3. Fetch Products for Low Stock Alerts
            const { data: products, error: productsError } = await supabase
                .from("products")
                .select("*")
                .or("is_deleted.is.null,is_deleted.eq.false");

            if (productsError) throw productsError;

            const lowStock = products.filter((p) => p.stok < 5);

            setStats({
                totalRevenue,
                paidOrders: paidOrders.length,
                totalUsers: usersCount || 0,
                totalProducts: products.length,
                lowStockProducts: lowStock,
                recentOrders: orders.slice(0, 5),
            });
        } catch (error) {
            console.error("Error fetching overview:", error);
            toast.error("Gagal memuat data ringkasan");
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
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 text-white shadow-lg">
                <h2 className="text-3xl font-bold mb-2">Halo, Admin! 👋</h2>
                <p className="opacity-90 max-w-xl">
                    Berikut adalah ringkasan performa toko **Green House** hari ini. Pantau stok dan pesanan terbaru Anda di sini.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">💰</div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Omzet</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📦</div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Pesanan Sukses</p>
                            <p className="text-xl font-bold text-gray-900">{stats.paidOrders} Order</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">👥</div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Pelanggan</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalUsers} User</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">🌿</div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Produk</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalProducts} Produk</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders - 2/3 Width */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-800">Pesanan Terbaru</h3>
                        <button
                            onClick={() => onSwitchTab("orders")}
                            className="text-sm text-green-600 font-semibold hover:underline"
                        >
                            Lihat Semua →
                        </button>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.recentOrders.length > 0 ? (
                                    stats.recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900">{order.nama_pembeli || order.email_pembeli || "Guest"}</p>
                                                <p className="text-xs text-gray-500">{order.email_pembeli || "-"}</p>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-green-600">
                                                {formatCurrency(order.total_harga)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status_pembayaran === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {order.status_pembayaran === 'paid' ? 'Paid' : 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-gray-500">Belum ada pesanan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock Alert - 1/3 Width */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span>⚠️</span> Stok Rendah
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                        {stats.lowStockProducts.length > 0 ? (
                            <>
                                <p className="text-sm text-gray-600">Segera isi ulang stok produk berikut:</p>
                                <div className="space-y-3">
                                    {stats.lowStockProducts.map((p) => (
                                        <div key={p.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                                            <img src={p.gambar_url} alt="" className="w-10 h-10 object-cover rounded-lg" />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-900 leading-tight">{p.nama_produk}</p>
                                                <p className="text-xs text-red-600 font-bold">Stok: {p.stok}</p>
                                            </div>
                                            <button
                                                onClick={() => onSwitchTab("products")}
                                                className="p-2 bg-white rounded-lg shadow-sm text-gray-400 hover:text-green-600"
                                            >
                                                ✏️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="py-8 text-center space-y-3">
                                <div className="text-4xl">✅</div>
                                <p className="text-sm text-gray-500 font-medium">Semua stok produk aman!</p>
                            </div>
                        )}

                        <button
                            onClick={() => onSwitchTab("products")}
                            className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
                        >
                            Kelola Produk
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
