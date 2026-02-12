import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { productsService } from '../services/productsService';

const CartDrawer = () => {
    const {
        isCartDrawerOpen,
        toggleCartDrawer,
        cartItems,
        removeFromCart,
        updateCartQuantity,
        cartTotal
    } = useCart();
    const { isAuthenticated, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);

    // Fetch recommendations when drawer opens and cart is empty
    useEffect(() => {
        if (isCartDrawerOpen && cartItems.length === 0) {
            fetchRecommendations();
        }
    }, [isCartDrawerOpen, cartItems.length]);

    const fetchRecommendations = async () => {
        try {
            setLoadingRecs(true);
            const data = await productsService.getFeaturedProducts();
            setRecommendations(data.slice(0, 3));
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        } finally {
            setLoadingRecs(false);
        }
    };

    const handleCheckout = () => {
        toggleCartDrawer(false);
        navigate('/checkout');
    };

    const handleClose = () => {
        toggleCartDrawer(false);
    };

    if (!isCartDrawerOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={handleClose}
            />

            {/* Drawer Panel */}
            <div className="absolute inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700 animate-in slide-in-from-right">
                    <div className="h-full flex flex-col bg-white shadow-2xl">

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Keranjang Saya</h2>
                            <button
                                onClick={handleClose}
                                className="p-2 -mr-2 text-gray-400 hover:text-gray-500 transition-colors"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
                            {cartItems.length > 0 ? (
                                <div className="space-y-6">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                                                <img
                                                    src={item.gambar_url}
                                                    alt={item.nama_produk}
                                                    className="h-full w-full object-cover object-center"
                                                />
                                            </div>

                                            <div className="flex flex-1 flex-col">
                                                <div className="flex justify-between text-base font-bold text-gray-900">
                                                    <h3 className="truncate max-w-[150px]">{item.nama_produk}</h3>
                                                    <p className="ml-4">{formatCurrency(item.harga * item.quantity)}</p>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500">{item.nama_kategori}</p>

                                                <div className="flex flex-1 items-end justify-between text-sm">
                                                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
                                                        <button
                                                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                                            className="px-2 py-1 hover:bg-gray-100 transition-colors"
                                                        > - </button>
                                                        <span className="px-3 py-1 bg-gray-50 font-medium">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                                            className="px-2 py-1 hover:bg-gray-100 transition-colors"
                                                        > + </button>
                                                    </div>

                                                    <div className="flex">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="font-medium text-red-500 hover:text-red-600 text-xs transition-colors"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col justify-center items-center text-center py-10">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-4xl mb-6 animate-bounce">
                                        🛒
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Wah, Keranjangmu Kosong.</h3>
                                    <p className="text-gray-500 text-sm mb-8">Yuk, cari teman hijau baru untuk rumahmu!</p>

                                    {/* Recommendations */}
                                    <div className="w-full mt-auto border-t border-gray-100 pt-8">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Sedang Populer:</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {loadingRecs ? (
                                                <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
                                            ) : (
                                                recommendations.map((prod) => (
                                                    <Link
                                                        to={`/product/${prod.id}`}
                                                        key={prod.id}
                                                        onClick={handleClose}
                                                        className="group flex items-center gap-4 text-left p-3 rounded-2xl hover:bg-emerald-50/50 border border-transparent hover:border-emerald-100 transition-all"
                                                    >
                                                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                                            <img src={prod.gambar_url} alt={prod.nama_produk} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 truncate">{prod.nama_produk}</p>
                                                            <p className="text-xs text-emerald-600 font-bold">{formatCurrency(prod.harga)}</p>
                                                            <p className="text-[10px] text-gray-400 font-medium">Beli Sekarang →</p>
                                                        </div>
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {cartItems.length > 0 && (
                            <div className="border-t border-gray-100 px-6 py-8 bg-gray-50/50">
                                <div className="flex justify-between text-base font-bold text-gray-900 mb-2">
                                    <p>Subtotal</p>
                                    <p>{formatCurrency(cartTotal)}</p>
                                </div>
                                <p className="text-xs text-gray-500 mb-6 italic">Ongkos kirim dan pajak dihitung saat checkout.</p>
                                <div className="space-y-3">
                                    {!isAdmin ? (
                                        <button
                                            onClick={handleCheckout}
                                            className="w-full flex items-center justify-center rounded-xl border border-transparent bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-xl hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-95 shadow-emerald-200"
                                        >
                                            Checkout Sekarang
                                        </button>
                                    ) : (
                                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                                            <p className="text-amber-700 text-sm font-bold flex items-center justify-center gap-2">
                                                <span>⚠️</span> Akun Admin tidak dapat belanja
                                            </p>
                                        </div>
                                    )}
                                    <Link
                                        to="/cart"
                                        onClick={handleClose}
                                        className="w-full flex items-center justify-center py-2 text-sm font-bold text-emerald-600 hover:underline"
                                    >
                                        Lihat Keranjang Lengkap
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartDrawer;
