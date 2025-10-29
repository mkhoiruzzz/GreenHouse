// src/services/cartService.js
const API_URL = 'http://localhost:5000/api';

// Helper untuk get user dari localStorage
const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  }
  return null;
};

export const cartService = {
  // Get cart items
  async getCart() {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    try {
      const response = await fetch(`${API_URL}/cart/${user.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil keranjang');
      }

      const total = data.cartItems.reduce((sum, item) => 
        sum + (item.harga * item.quantity), 0
      );

      return {
        cartItems: data.cartItems,
        total: total
      };
    } catch (error) {
      throw error;
    }
  },

  // Add to cart
  async addToCart(productId, quantity = 1) {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Silakan login terlebih dahulu');
    }

    console.log('Adding to cart:', { user_id: user.id, product_id: productId, quantity });

    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          product_id: productId,
          quantity: quantity
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menambahkan ke keranjang');
      }

      return data;
    } catch (error) {
      console.error('Error in addToCart service:', error);
      throw error;
    }
  },

  // Update cart item quantity
  async updateCartItem(cartItemId, quantity) {
    try {
      const response = await fetch(`${API_URL}/cart/${cartItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengupdate keranjang');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Remove from cart
  async removeFromCart(cartItemId) {
    try {
      const response = await fetch(`${API_URL}/cart/${cartItemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menghapus dari keranjang');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Clear cart
  async clearCart() {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    try {
      const response = await fetch(`${API_URL}/cart/clear/${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengosongkan keranjang');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }
};