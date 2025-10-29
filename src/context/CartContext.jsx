// src/context/CartContext.jsx - JIKA BELUM ADA, BUAT FILE INI
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        cartItems: action.payload || []
      };
    
    case 'ADD_TO_CART':
      const existingItem = state.cartItems.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          cartItems: state.cartItems.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }
      return {
        ...state,
        cartItems: [...state.cartItems, { ...action.payload, quantity: action.payload.quantity }]
      };
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cartItems: state.cartItems.filter(item => item.id !== action.payload)
      };
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        cartItems: state.cartItems.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        cartItems: []
      };
    
    default:
      return state;
  }
};

const initialState = {
  cartItems: []
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Calculate cart total
  const cartTotal = state.cartItems.reduce((total, item) => {
    return total + (item.harga * item.quantity);
  }, 0);

  const addToCart = async (product, quantity = 1) => {
    try {
      // Validasi stok
      if (quantity > product.stok) {
        throw new Error(`Stok ${product.nama_produk} tidak mencukupi. Stok tersedia: ${product.stok}`);
      }

      dispatch({
        type: 'ADD_TO_CART',
        payload: { 
          ...product, 
          quantity,
          // Pastikan gambar_url tersedia
          gambar_url: product.gambar_url || product.gambar || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia'
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = (productId) => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: productId
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { id: productId, quantity }
    });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{
      cartItems: state.cartItems,
      cartTotal,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};