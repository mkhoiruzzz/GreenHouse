
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';

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

  // ✅ FIX: Validasi email sebelum login/register
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // ✅ FIX: Validasi email format
      if (!validateEmail(email)) {
        toast.error('Format email tidak valid');
        return { success: false, message: 'Format email tidak valid' };
      }

      // ✅ FIX: Validasi input
      if (!email || !password) {
        toast.error('Email dan password wajib diisi');
        return { success: false, message: 'Email dan password wajib diisi' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), // ✅ FIX: Convert to lowercase
        password: password
      });

      if (error) {
        console.error('Login error:', error);
        
        // ✅ FIX: Handle berbagai jenis error
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
      
      // ✅ FIX: Validasi lengkap
      if (!userData.email || !userData.password || !userData.username) {
        toast.error('Email, username, dan password wajib diisi');
        return { success: false, message: 'Data wajib belum lengkap' };
      }

      if (!validateEmail(userData.email)) {
        toast.error('Format email tidak valid');
        return { success: false, message: 'Format email tidak valid' };
      }

      if (userData.password.length < 6) {
        toast.error('Password minimal 6 karakter');
        return { success: false, message: 'Password minimal 6 karakter' };
      }

      // ✅ FIX: Gunakan email lowercase
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
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        console.error('Register error:', error);
        
        // ✅ FIX: Handle berbagai error register
        if (error.message.includes('already registered')) {
          toast.error('Email sudah terdaftar. Silakan gunakan email lain.');
          return { success: false, message: 'Email sudah terdaftar' };
        } else if (error.message.includes('invalid')) {
          toast.error('Format email tidak valid');
          return { success: false, message: 'Format email tidak valid' };
        } else {
          toast.error(error.message);
          return { success: false, message: error.message };
        }
      }

      // ✅ FIX: Buat profile dengan error handling yang lebih baik
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: email,
              username: userData.username,
              full_name: userData.nama_lengkap || '',
              phone: userData.no_telepon || '',
              address: userData.alamat || '',
              city: userData.kota || '',
              province: userData.provinsi || '',
              role: 'customer'
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.warn('Profile creation warning:', profileError.message);
            // Lanjutkan saja, tidak critical
          }
        } catch (profileError) {
          console.warn('Profile creation failed:', profileError);
        }
      }

      // ✅ FIX: Handle case email sudah terdaftar
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

  const resendConfirmationEmail = async (email) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        toast.error(error.message);
        return { success: false, message: error.message };
      }

      toast.success('Email konfirmasi telah dikirim ulang!');
      return { success: true };
    } catch (error) {
      console.error('Resend confirmation error:', error);
      toast.error('Gagal mengirim ulang email konfirmasi');
      return { success: false, message: 'Gagal mengirim ulang email' };
    }
  };

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

  const updateProfile = async (profileData) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: profileData
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Profil berhasil diperbarui!');
        return { success: true };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Terjadi kesalahan saat memperbarui profil');
      return { success: false, message: error.message };
    }
  };

  const updateUser = async (userData) => {
    try {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateUser,
    resendConfirmationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
