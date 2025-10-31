// src/context/CartContext.jsx - SIMPLE VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // ✅ LOAD CART DARI LOCALSTORAGE SAAT START
  useEffect(() => {
    const saved = localStorage.getItem('simple_cart');
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
        console.log('🛒 Cart loaded from storage');
      } catch (e) {
        console.log('❌ Error loading cart');
      }
    }
  }, []);

  // ✅ SIMPAN KE LOCALSTORAGE SETIAP PERUBAHAN
  useEffect(() => {
    localStorage.setItem('simple_cart', JSON.stringify(cartItems));
    console.log('💾 Cart saved:', cartItems.length, 'items');
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      if (existing) {
        return prev.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { 
          ...product, 
          quantity,
          gambar_url: product.gambar_url || 'https://placehold.co/400x300/4ade80/white?text=No+Image'
        }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('simple_cart');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.harga * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};