import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';

const Cart = () => {
  const { cartItems, removeFromCart, updateCartQuantity, clearCart, cartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const { t } = useTheme();
  const navigate = useNavigate();
  const [imageErrors, setImageErrors] = useState({});

  // AUTO SCROLL TO TOP WHEN CART ITEMS CHANGE
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [cartItems]);

  const handleImageError = (itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen mt-16 py-12 flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 transition-colors duration-300">
            {t('Login Diperlukan', 'Login Required')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm transition-colors duration-300">
            {t('Silakan login untuk melihat keranjang', 'Please login to view cart')}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-emerald-600 dark:bg-emerald-700 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all duration-300 text-sm"
          >
            {t('Login Sekarang', 'Login Now')}
          </button>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (cartId, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartQuantity(cartId, newQuantity);
  };

  const handleRemoveItem = (cartId, productName) => {
    if (window.confirm(t(
      `Hapus ${productName}?`,
      `Remove ${productName}?`
    ))) {
      removeFromCart(cartId);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const totalItems = cartItems ? cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
  // ✅ FIXED: Hapus ongkir dari cart - ongkir ditentukan di checkout step 2
  const total = cartTotal; // Tidak ada ongkir di cart

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen mt-16 py-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-5xl mb-3">🛒</div>
          <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2 transition-colors duration-300">
            {t('Keranjang Kosong', 'Cart is Empty')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm transition-colors duration-300">
            {t('Yuk, belanja tanaman favoritmu!', "Let's shop for your favorite plants!")}
          </p>
          <button
            onClick={() => navigate('/products')}
            className="bg-emerald-600 dark:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all duration-300 text-sm"
          >
            {t('Jelajahi Produk', 'Explore Products')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-16 py-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 transition-colors duration-300">
          {t('Keranjang Belanja', 'Shopping Cart')} ({totalItems} {t('items', 'items')})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 transition-all duration-300">
              {cartItems && cartItems.map((item) => (
                <div key={item.id} className="p-3 flex items-center gap-3">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden border border-gray-200 dark:border-gray-600">
                    {item.gambar_url && !imageErrors[item.id] ? (
                      <img
                        src={item.gambar_url}
                        alt={item.nama_produk}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(item.id)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-2xl">
                        {item.icon || '🌿'}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate transition-colors duration-300">
                      {item.nama_produk}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      {item.category_icon} {item.nama_kategori}
                    </p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 transition-colors duration-300">
                      {formatCurrency(item.harga)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors duration-300"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-semibold text-sm text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors duration-300"
                      disabled={item.quantity >= item.stok}
                    >
                      +
                    </button>
                  </div>

                  {/* Price & Remove */}
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap transition-colors duration-300">
                      {formatCurrency(item.harga * item.quantity)}
                    </p>
                    <button
                      onClick={() => handleRemoveItem(item.id, item.nama_produk)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs mt-1 transition-colors duration-300"
                    >
                      🗑️ {t('Hapus', 'Remove')}
                    </button>
                  </div>
                </div>
              ))}

              {/* Clear All */}
              <div className="p-3">
                <button
                  onClick={() => {
                    if (window.confirm(t('Hapus semua item?', 'Remove all items?'))) clearCart();
                  }}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-semibold transition-colors duration-300"
                >
                  🗑️ {t('Hapus Semua', 'Remove All')}
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4 sticky top-20 border border-gray-100 dark:border-gray-700 transition-all duration-300">
              <h2 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-3 transition-colors duration-300">
                {t('Ringkasan', 'Summary')}
              </h2>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                    {t('Subtotal', 'Subtotal')}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                {/* ✅ REMOVED: Ongkir dari cart - akan ditentukan di checkout */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900 dark:text-white transition-colors duration-300">
                      Total
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 transition-colors duration-300">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-emerald-600 dark:bg-emerald-700 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all duration-300 mb-2 text-sm hover:shadow-lg"
              >
                🛒 {t('Checkout', 'Checkout')}
              </button>

              <button
                onClick={() => navigate('/products')}
                className="w-full border border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 py-2 rounded-lg font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-300 text-sm"
              >
                ➕ {t('Belanja Lagi', 'Continue Shopping')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;