import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';

const Cart = () => {
  const { cartItems, removeFromCart, updateCartQuantity, clearCart, cartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [imageErrors, setImageErrors] = useState({});

  // AUTO SCROLL TO TOP WHEN CART ITEMS CHANGE
  useEffect(() => {
    // Scroll ke atas ketika cart items berubah
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [cartItems]); // Trigger ketika cartItems berubah

  const handleImageError = (itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen mt-16 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-4 text-sm">Silakan login untuk melihat keranjang</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-secondary text-white px-5 py-2 rounded-lg hover:bg-accent transition text-sm"
          >
            Login Sekarang
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
    if (window.confirm(`Hapus ${productName}?`)) {
      removeFromCart(cartId);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // PERBAIKAN: Pastikan cartItems ada sebelum di-reduce
  const totalItems = cartItems ? cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
  const shippingCost = cartTotal > 0 ? 15000 : 0;
  const total = cartTotal + shippingCost;

  // PERBAIKAN: Cek jika cartItems tidak ada atau kosong
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen mt-16 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-5xl mb-3">🛒</div>
          <h1 className="text-2xl font-bold text-primary mb-2">Keranjang Kosong</h1>
          <p className="text-gray-600 mb-6 text-sm">Yuk, belanja tanaman favoritmu!</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-secondary text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent transition text-sm"
          >
            Jelajahi Produk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-16 py-6">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-primary mb-4">Keranjang Belanja ({totalItems} items)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cart Items - With Images */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md divide-y">
              {/* PERBAIKAN: Tambahkan null check untuk cartItems */}
              {cartItems && cartItems.map((item) => (
                <div key={item.id} className="p-3 flex items-center gap-3">
                  {/* Product Image - UPDATED */}
                  <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden">
                    {item.gambar_url && !imageErrors[item.id] ? (
                      <img
                        src={item.gambar_url}
                        alt={item.nama_produk}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(item.id)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-2xl">
                        {item.icon || '🌿'}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-sm text-primary truncate">{item.nama_produk}</h3>
                    <p className="text-xs text-gray-600">{item.category_icon} {item.nama_kategori}</p>
                    <p className="text-sm font-bold text-secondary">{formatCurrency(item.harga)}</p>
                  </div>

                  {/* Quantity Controls - Compact */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-sm"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-sm"
                      disabled={item.quantity >= item.stok}
                    >
                      +
                    </button>
                  </div>

                  {/* Price & Remove */}
                  <div className="text-right">
                    <p className="font-bold text-primary text-sm whitespace-nowrap">
                      {formatCurrency(item.harga * item.quantity)}
                    </p>
                    <button
                      onClick={() => handleRemoveItem(item.id, item.nama_produk)}
                      className="text-red-500 hover:text-red-700 text-xs mt-1"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              ))}

              {/* Clear All */}
              <div className="p-3">
                <button
                  onClick={() => {
                    if (window.confirm('Hapus semua item?')) clearCart();
                  }}
                  className="text-red-500 hover:text-red-700 text-xs font-semibold"
                >
                  🗑️ Hapus Semua
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary - Compact & Sticky */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-20">
              <h2 className="font-semibold text-primary mb-3">Ringkasan</h2>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ongkir</span>
                  <span className="font-semibold">{formatCurrency(shippingCost)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-secondary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-secondary text-white py-2 rounded-lg font-semibold hover:bg-accent transition mb-2 text-sm"
              >
                🛒 Checkout
              </button>

              <button
                onClick={() => navigate('/products')}
                className="w-full border border-secondary text-secondary py-2 rounded-lg font-semibold hover:bg-secondary hover:text-white transition text-sm"
              >
                ➕ Belanja Lagi
              </button>

              {/* Info */}
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                <p className="text-gray-600">
                  <strong>📦 Info:</strong> Pengiriman disesuaikan dengan ketahanan tanaman
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;