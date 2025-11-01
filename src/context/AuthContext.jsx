import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { accountService } from '../services/accountService'; // ✅ Import service

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

  const login = async (email, password) => {
    try {
      setLoading(true);

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

  // ✅ PERBAIKI FUNGSI HAPUS AKUN DENGAN ACCOUNT SERVICE
  const deleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, message: 'User tidak ditemukan' };
      }

      console.log('🔄 Starting account deletion process for user:', user.id);

      let result;

      try {
        // Coba hard delete dulu
        result = await accountService.deleteUserAccount(user.id);
      } catch (hardDeleteError) {
        console.warn('⚠️ Hard delete failed, trying soft delete:', hardDeleteError);
        
        // Fallback ke soft delete
        result = await accountService.softDeleteAccount(user.id);
      }

      // Jika berhasil, sign out dan clear data
      if (result.success) {
        await supabase.auth.signOut();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }

      return result;

    } catch (error) {
      console.error('❌ Delete account error:', error);
      return { 
        success: false, 
        message: error.message || 'Gagal menghapus akun. Silakan coba lagi.' 
      };
    }
  };

  // ✅ FUNGSI UPDATE PROFILE
  const updateProfile = async (profileData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, message: 'User tidak ditemukan' };
      }

      // Update di tabel profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: profileData.username,
          full_name: profileData.full_name,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          province: profileData.province,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Update user metadata di auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          username: profileData.username,
          full_name: profileData.full_name,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          province: profileData.province
        }
      });

      if (authError) {
        console.error('Error updating auth user:', authError);
        throw authError;
      }

      return { success: true, message: 'Profil berhasil diperbarui' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        message: error.message || 'Gagal memperbarui profil' 
      };
    }
  };

  // ✅ Login dengan Google
  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: "https://green-house-khoiruz.vercel.app/",
        },
      });

      if (error) throw error;
      toast.info('Mengalihkan ke Google...');
      return data;
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Gagal login dengan Google');
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
    deleteAccount,
    updateProfile,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};