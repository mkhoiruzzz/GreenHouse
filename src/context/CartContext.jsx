// src/context/CartContext.jsx - WITH LOCALSTORAGE
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  let newState;
  
  switch (action.type) {
    case 'LOAD_CART':
      return {
        ...state,
        cartItems: action.payload || []
      };
    
    case 'ADD_TO_CART':
      const existingItem = state.cartItems.find(item => item.id === action.payload.id);
      if (existingItem) {
        newState = {
          ...state,
          cartItems: state.cartItems.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      } else {
        newState = {
          ...state,
          cartItems: [...state.cartItems, { ...action.payload, quantity: action.payload.quantity }]
        };
      }
      break;
    
    case 'REMOVE_FROM_CART':
      newState = {
        ...state,
        cartItems: state.cartItems.filter(item => item.id !== action.payload)
      };
      break;
    
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        newState = {
          ...state,
          cartItems: state.cartItems.filter(item => item.id !== action.payload.id)
        };
      } else {
        newState = {
          ...state,
          cartItems: state.cartItems.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: action.payload.quantity }
              : item
          )
        };
      }
      break;
    
    case 'CLEAR_CART':
      newState = {
        ...state,
        cartItems: []
      };
      break;
    
    default:
      return state;
  }

  // ✅ SIMPAN KE LOCALSTORAGE SETIAP PERUBAHAN
  if (newState) {
    localStorage.setItem('cart', JSON.stringify(newState.cartItems));
  }
  
  return newState || state;
};

const initialState = {
  cartItems: []
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // ✅ LOAD CART DARI LOCALSTORAGE SAAT KOMPONEN MOUNT
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
        console.log('🛒 Cart loaded from localStorage:', cartItems);
      } catch (error) {
        console.error('❌ Error loading cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Calculate cart total
  const cartTotal = state.cartItems.reduce((total, item) => {
    return total + (item.harga * item.quantity);
  }, 0);

  // Calculate cart count
  const cartCount = state.cartItems.reduce((total, item) => {
    return total + item.quantity;
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
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { id: productId, quantity }
    });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    // ✅ HAPUS JUGA DARI LOCALSTORAGE
    localStorage.removeItem('cart');
  };

  const getCartTotal = () => {
    return cartTotal;
  };

  const getCartCount = () => {
    return cartCount;
  };

  return (
    <CartContext.Provider value={{
      cartItems: state.cartItems,
      cartTotal,
      cartCount,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      getCartTotal,
      getCartCount
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