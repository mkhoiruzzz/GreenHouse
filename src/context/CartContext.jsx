import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const CartContext = createContext();

// ✅ STORAGE UTILITY FUNCTIONS
const storage = {
  // Simpan ke multiple storage untuk redundancy
  setItem: (key, data) => {
    try {
      const serializedData = JSON.stringify(data);

      // Coba localStorage dulu
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, serializedData);
      }

      // Juga simpan ke sessionStorage sebagai backup
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, serializedData);
      }

      console.log('💾 Cart saved to storage');
    } catch (error) {
      console.warn('⚠️ Could not save cart to storage:', error);
    }
  },

  // Load dari storage dengan fallback
  getItem: (key) => {
    try {
      // Coba localStorage dulu
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(key);
        if (item) {
          return JSON.parse(item);
        }
      }

      // Fallback ke sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        const item = sessionStorage.getItem(key);
        if (item) {
          return JSON.parse(item);
        }
      }

      return null;
    } catch (error) {
      console.warn('⚠️ Could not load cart from storage:', error);
      return null;
    }
  },

  // Hapus dari semua storage
  removeItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(key);
      }
      console.log('🗑️ Cart cleared from storage');
    } catch (error) {
      console.warn('⚠️ Could not clear cart from storage:', error);
    }
  }
};

const cartReducer = (state, action) => {
  let newState;

  switch (action.type) {
    case 'LOAD_CART':
      return {
        ...state,
        cartItems: action.payload || [],
        loaded: true
      };

    case 'ADD_TO_CART':
      const existingItem = state.cartItems.find(item => item.id === action.payload.id);
      if (existingItem) {
        newState = {
          ...state,
          cartItems: state.cartItems.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: Math.min(item.quantity + action.payload.quantity, item.stok || 999) }
              : item
          )
        };
      } else {
        newState = {
          ...state,
          cartItems: [...state.cartItems, {
            ...action.payload,
            quantity: Math.min(action.payload.quantity, action.payload.stok || 999),
            addedAt: new Date().toISOString() // timestamp untuk sorting
          }]
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
        // Jangan melebihi stok
        const product = state.cartItems.find(item => item.id === action.payload.id);
        const maxQuantity = product?.stok || 999;
        const safeQuantity = Math.min(action.payload.quantity, maxQuantity);

        newState = {
          ...state,
          cartItems: state.cartItems.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: safeQuantity }
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

  // ✅ SIMPAN KE STORAGE SETIAP PERUBAHAN
  if (newState) {
    storage.setItem('plantique_cart', newState.cartItems);
  }

  return newState || state;
};

const initialState = {
  cartItems: [],
  loaded: false
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = React.useState(false);
  const { user, isAuthenticated } = useAuth();
  const isInitialMount = useRef(true);
  const isSyncing = useRef(false);
  const prevAuth = useRef(isAuthenticated);

  // ✅ CLEAR CART ON LOGOUT
  useEffect(() => {
    // Detect transition from true to false (logout)
    if (prevAuth.current && !isAuthenticated) {
      console.log('🚪 Logout detected in CartContext, clearing cart...');
      clearCart();
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  // ✅ SYNC WITH SUPABASE
  useEffect(() => {
    const syncCart = async () => {
      if (!isAuthenticated || !user || isSyncing.current) return;

      try {
        isSyncing.current = true;
        console.log('🔄 Syncing cart to Supabase...');

        // 1. Delete existing items for user
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);

        // 2. Insert current local items
        if (state.cartItems.length > 0) {
          const itemsToSync = state.cartItems.map(item => ({
            user_id: user.id,
            product_id: item.id,
            quantity: item.quantity
          }));

          const { error } = await supabase
            .from('cart_items')
            .insert(itemsToSync);

          if (error) throw error;
        }

        console.log('✅ Cart synced to Supabase');
      } catch (error) {
        console.warn('⚠️ Sync to Supabase failed:', error.message);
      } finally {
        isSyncing.current = false;
      }
    };

    // Debounce sync to avoid too many writes
    if (!isInitialMount.current) {
      const timeout = setTimeout(syncCart, 2000);
      return () => clearTimeout(timeout);
    }
  }, [state.cartItems, user, isAuthenticated]);

  // ✅ LOAD FROM SUPABASE ON LOGIN
  useEffect(() => {
    const loadFromSupabase = async () => {
      if (!isAuthenticated || !user) return;

      try {
        console.log('📥 Loading cart from Supabase...');
        const { data, error } = await supabase
          .from('cart_items')
          .select(`
            quantity,
            product_id,
            products:product_id (*)
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        if (data) {
          const supabaseItems = data.map(item => ({
            ...item.products,
            quantity: item.quantity,
            addedAt: new Date().toISOString()
          }));

          const mergedItems = [...state.cartItems];

          supabaseItems.forEach(sItem => {
            const index = mergedItems.findIndex(mItem => mItem.id === sItem.id);
            if (index !== -1) {
              mergedItems[index] = sItem;
            } else {
              mergedItems.push(sItem);
            }
          });

          dispatch({ type: 'LOAD_CART', payload: mergedItems });
          console.log(`✅ Cart loaded/merged from Supabase: ${mergedItems.length} items`);
        } else {
          // If no data in Supabase, we still want to set items (maybe keep local gas)
          dispatch({ type: 'LOAD_CART', payload: state.cartItems });
          console.log('✅ Supabase cart empty, keeping local items');
        }
      } catch (error) {
        console.error('❌ Failed to load from Supabase:', error.message);
      } finally {
        isInitialMount.current = false;
      }
    };

    if (isAuthenticated) {
      loadFromSupabase();
    } else {
      isInitialMount.current = false;
    }
  }, [isAuthenticated]);

  // ✅ LOAD CART DARI STORAGE SAAT KOMPONEN MOUNT
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = storage.getItem('plantique_cart');
        if (savedCart && Array.isArray(savedCart)) {
          // Validasi data cart
          const validCartItems = savedCart.filter(item =>
            item &&
            item.id &&
            item.nama_produk &&
            item.harga &&
            item.quantity > 0
          );

          dispatch({ type: 'LOAD_CART', payload: validCartItems });
          console.log('🛒 Cart loaded from storage:', validCartItems.length, 'items');
        } else {
          console.log('🛒 No saved cart found');
          dispatch({ type: 'LOAD_CART', payload: [] });
        }
      } catch (error) {
        console.error('❌ Error loading cart:', error);
        dispatch({ type: 'LOAD_CART', payload: [] });
      }
    };

    loadCart();
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
      const availableStock = product.stok || 999;
      if (quantity > availableStock) {
        throw new Error(`Stok ${product.nama_produk} tidak mencukupi. Stok tersedia: ${availableStock}`);
      }

      // Cek jika item sudah ada di cart
      const existingItem = state.cartItems.find(item => item.id === product.id);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const newTotalQuantity = currentQuantity + quantity;

      if (newTotalQuantity > availableStock) {
        throw new Error(`Stok ${product.nama_produk} tidak mencukupi. Stok tersedia: ${availableStock}, jumlah di keranjang: ${currentQuantity}`);
      }

      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          ...product,
          quantity,
          gambar_url: product.gambar_url || product.gambar || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia',
          stok: product.stok || 999
        }
      });

      console.log('✅ Added to cart:', product.nama_produk, 'x', quantity);
      return { success: true };

    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = (productId) => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: productId
    });
    console.log('🗑️ Removed from cart:', productId);
  };

  const updateCartQuantity = (productId, quantity) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { id: productId, quantity }
    });
    console.log('✏️ Updated cart quantity:', productId, 'x', quantity);
  };

  // ✅ CLEAR CART DARI STORAGE
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    storage.removeItem('plantique_cart');
    console.log('🛒 Cart cleared');
  };

  // ✅ TOGGLE CART DRAWER
  const toggleCartDrawer = (isOpen) => {
    setIsCartDrawerOpen(prevState => isOpen !== undefined ? isOpen : !prevState);
  };

  return (
    <CartContext.Provider value={{
      cartItems: state.cartItems,
      cartTotal,
      cartCount,
      cartLoaded: state.loaded,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      isCartDrawerOpen,
      toggleCartDrawer
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