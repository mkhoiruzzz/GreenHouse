// src/services/authService.js
const API_URL = 'http://localhost:5000/api';

export const authService = {
  // Login
  async login(credentials) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login gagal');
      }

      // Simpan user data di localStorage
      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token || ''); // jika pakai token
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Register
  async register(userData) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registrasi gagal');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  },

  // Logout
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  // Check if user is logged in
  isAuthenticated() {
    return !!this.getCurrentUser();
  }
};