import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { accountService } from '../services/accountService';
import { supabase, invokeFunction } from '../lib/supabase';

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

  const checkAdminRole = async (userId) => {
  try {
    console.log('🔍 Checking admin role for user:', userId);
    
    // 🚨 TEMPORARY SOLUTION - Skip database check completely
    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData.user?.email;
    
    console.log('📧 User email:', userEmail);
    
    // FORCE ADMIN untuk admin@example.com - NO DATABASE CHECK
    if (userEmail === 'admin@example.com') {
      console.log('🎯 TEMPORARY: FORCE ADMIN for admin@example.com');
      setIsAdmin(true);
      return true;
    }
    
    // Untuk user lain, return false
    console.log('❌ User is NOT admin');
    setIsAdmin(false);
    return false;
    
  } catch (error) {
    console.error('💥 Error in checkAdminRole:', error);
    
    // Fallback: jika ada error, tetap cek email
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.email === 'admin@example.com') {
      setIsAdmin(true);
      return true;
    }
    
    setIsAdmin(false);
    return false;
  }
};

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (session) {
          const userData = session.user;
          setUser(userData);
          setIsAuthenticated(true);
          
          // Check admin role dari profiles table
          await checkAdminRole(userData.id);
          
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
        
        // Check admin role dari profiles table
        await checkAdminRole(userData.id);
        
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
        
        // Check admin role dari profiles table setelah login
        await checkAdminRole(userData.id);
        
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

  const deleteAccount = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "User tidak ditemukan" };
    }

    console.log('🔄 Menghapus akun untuk user:', user.id);

    // ✅ Gunakan helper function invokeFunction
    const result = await invokeFunction('delete-account', { 
      user_id: user.id 
    });

    console.log('✅ Akun berhasil dihapus:', result);

    // Logout setelah berhasil hapus
    await supabase.auth.signOut();

    return { success: true, message: "Akun berhasil dihapus" };

  } catch (err) {
    console.error('❌ Error menghapus akun:', err);
    return { 
      success: false, 
      message: err.message || "Gagal menghapus akun. Silakan coba lagi." 
    };
  }
};



  const updateProfile = async (profileData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, message: 'User tidak ditemukan' };
      }

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