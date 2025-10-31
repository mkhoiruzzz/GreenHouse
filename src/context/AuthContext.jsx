// Di AuthContext.jsx - UPDATE register function dan tambah createUserProfile
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

  // ✅ FUNCTION BARU: Auto Create Profile di Table
  const createUserProfile = async (userData) => {
    try {
      console.log('🔄 Creating user profile in profiles table...', userData);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userData.id,
          email: userData.email,
          username: userData.user_metadata?.username || userData.email.split('@')[0],
          full_name: userData.user_metadata?.full_name || '',
          phone: userData.user_metadata?.phone || '',
          address: userData.user_metadata?.address || '',
          city: userData.user_metadata?.city || '',
          province: userData.user_metadata?.province || '',
          role: userData.user_metadata?.role || 'customer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        // Jika error karena duplicate, coba update saja
        if (error.code === '23505') {
          console.log('🔄 Profile already exists, updating instead...');
          const { data: updateData, error: updateError } = await supabase
            .from('profiles')
            .update({
              username: userData.user_metadata?.username || userData.email.split('@')[0],
              full_name: userData.user_metadata?.full_name || '',
              phone: userData.user_metadata?.phone || '',
              address: userData.user_metadata?.address || '',
              city: userData.user_metadata?.city || '',
              province: userData.user_metadata?.province || '',
              updated_at: new Date().toISOString()
            })
            .eq('id', userData.id)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Error updating profile:', updateError);
            return { success: false, error: updateError };
          }
          return { success: true, data: updateData };
        }
        return { success: false, error };
      }

      console.log('✅ Profile created successfully:', data);
      return { success: true, data };

    } catch (error) {
      console.error('❌ Exception creating profile:', error);
      return { success: false, error };
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
        
        // ✅ AUTO CREATE PROFILE JIKA BELUM ADA (saat login)
        await createUserProfile(userData);
        
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

      // ✅ AUTO CREATE PROFILE DI TABLE PROFILES
      if (data.user) {
        console.log('🎯 Creating profile for new user:', data.user);
        const profileResult = await createUserProfile(data.user);
        
        if (!profileResult.success) {
          console.error('⚠️ Profile creation failed but user registered:', profileResult.error);
          // Lanjutkan saja, user tetap terdaftar
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

  // ✅ FUNCTION BARU: Update Profile (untuk Profile.jsx)
  const updateProfile = async (profileData) => {
    try {
      if (!user) throw new Error('No user logged in');

      console.log('🔄 Updating profile data:', profileData);

      // Update user metadata di Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: profileData
      });

      if (authError) throw authError;

      // Update profile di table profiles
      const { data: profileResult, error: profileError } = await supabase
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
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) {
        console.error('❌ Error updating profile table:', profileError);
        // Coba create jika belum ada
        const createResult = await createUserProfile({
          id: user.id,
          email: user.email,
          user_metadata: profileData
        });
        if (!createResult.success) {
          throw profileError;
        }
      }

      // Update local user state
      setUser(authData.user);
      localStorage.setItem('user', JSON.stringify(authData.user));

      console.log('✅ Profile updated successfully');
      return { success: true, user: authData.user };

    } catch (error) {
      console.error('❌ Update profile error:', error);
      return { success: false, error: error.message };
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

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    login,
    register,
    logout,
    updateProfile // ✅ TAMBAH INI
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};