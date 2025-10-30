import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';

// PERBAIKAN: Import dari config yang sama
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (session) {
          const userData = session.user;
          setUser(userData);
          setIsAuthenticated(true);
          setIsAdmin(userData.user_metadata?.role === 'admin');
          localStorage.setItem('token', session.access_token);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setIsAdmin(false);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session) {
        const userData = session.user;
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(userData.user_metadata?.role === 'admin');
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  // HAPUS: validateEmail function tidak perlu karena Supabase sudah handle

  const login = async (email, password) => {
    try {
      setLoading(true);

      // HAPUS: Validasi manual, biarkan Supabase handle
      if (!email || !password) {
        toast.error('Email dan password wajib diisi');
        return { success: false, message: 'Email dan password wajib diisi' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (error) {
        console.error('Login error:', error);
        
        // Handle error
        if (error.message.includes('Email not confirmed')) {
          toast.error('Email belum dikonfirmasi. Silakan cek email Anda.');
          return { 
            success: false, 
            message: 'Email belum dikonfirmasi',
            needsConfirmation: true 
          };
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Email atau password salah');
          return { 
            success: false, 
            message: 'Email atau password salah' 
          };
        } else {
          toast.error(error.message);
          return { success: false, message: error.message };
        }
      }

      if (data.session && data.user) {
        const userData = data.user;
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(userData.user_metadata?.role === 'admin');
        localStorage.setItem('token', data.session.access_token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        toast.success('Login berhasil!');
        return { success: true, user: userData };
      }

      return { success: false, message: 'Login gagal' };

    } catch (error) {
      console.error('Login exception:', error);
      toast.error('Terjadi kesalahan saat login');
      return { success: false, message: 'Terjadi kesalahan' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      
      // Validasi dasar
      if (!userData.email || !userData.password || !userData.username) {
        toast.error('Email, username, dan password wajib diisi');
        return { success: false, message: 'Data wajib belum lengkap' };
      }

      if (userData.password.length < 6) {
        toast.error('Password minimal 6 karakter');
        return { success: false, message: 'Password minimal 6 karakter' };
      }

      const email = userData.email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.nama_lengkap || '',
            phone: userData.no_telepon || '',
            address: userData.alamat || '',
            city: userData.kota || '',
            province: userData.provinsi || '',
            role: 'customer'
          }
        }
      });

      if (error) {
        console.error('Register error:', error);
        
        if (error.message.includes('already registered')) {
          toast.error('Email sudah terdaftar. Silakan gunakan email lain.');
          return { success: false, message: 'Email sudah terdaftar' };
        } else {
          toast.error(error.message);
          return { success: false, message: error.message };
        }
      }

      // HAPUS: Buat profile di tabel terpisah (tidak perlu kompleks)

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.error('Email sudah terdaftar');
        return { success: false, message: 'Email sudah terdaftar' };
      }

      toast.success('Registrasi berhasil! Silakan cek email untuk verifikasi.');
      return { success: true, user: data.user };

    } catch (error) {
      console.error('Register exception:', error);
      toast.error('Terjadi kesalahan saat registrasi');
      return { success: false, message: 'Terjadi kesalahan' };
    } finally {
      setLoading(false);
    }
  };

  // HAPUS: resendConfirmationEmail (tidak perlu)

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.info('Anda telah logout');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Gagal logout');
    } finally {
      setLoading(false);
    }
  };

  // HAPUS: updateProfile dan updateUser (tidak perlu untuk sekarang)

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    login,
    register,
    logout
    // HAPUS: updateProfile, updateUser, resendConfirmationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};