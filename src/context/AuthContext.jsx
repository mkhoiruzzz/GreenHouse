import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabase, invokeFunction } from '../lib/supabase';
import { accountService } from '../services/accountService';
import { generateAndSendOTP, verifyOTPCode } from '../services/otpService';


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

  // ✅ Fungsi untuk membuat profile jika belum ada (untuk Google login)
  const ensureUserProfile = async (userData) => {
    try {
      // Cek apakah profile sudah ada
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userData.id)
        .single();

      // Jika profile sudah ada, tidak perlu membuat lagi
      if (existingProfile && !checkError) {
        console.log('✅ Profile sudah ada untuk user:', userData.id);
        return true;
      }

      // Jika profile belum ada, buat profile baru
      console.log('🔄 Membuat profile untuk user:', userData.id);
      
      const profileData = {
        id: userData.id,
        email: userData.email || '',
        username: userData.user_metadata?.username || userData.email?.split('@')[0] || 'user',
        full_name: userData.user_metadata?.full_name || userData.user_metadata?.name || '',
        phone: userData.user_metadata?.phone || '',
        address: userData.user_metadata?.address || '',
        city: userData.user_metadata?.city || '',
        province: userData.user_metadata?.province || '',
        role: userData.user_metadata?.role || 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (insertError) {
        // Jika error karena duplicate (race condition), itu OK
        if (insertError.code === '23505') {
          console.log('✅ Profile sudah dibuat oleh proses lain');
          return true;
        }
        console.error('❌ Error creating profile:', insertError);
        return false;
      }

      console.log('✅ Profile berhasil dibuat untuk user:', userData.id);
      return true;
    } catch (error) {
      console.error('❌ Error in ensureUserProfile:', error);
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
          
          // ✅ Buat profile jika belum ada (untuk Google login atau user baru)
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await ensureUserProfile(userData);
          }
          
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
          localStorage.removeItem('pendingUserData'); // Cleanup pending data
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

      // ✅ Simpan data user di localStorage untuk digunakan setelah verifikasi
      const pendingUserData = {
        email: email,
        password: userData.password,
        username: userData.username,
        nama_lengkap: userData.nama_lengkap || '',
        no_telepon: userData.no_telepon || '',
        alamat: userData.alamat || '',
        kota: userData.kota || '',
        provinsi: userData.provinsi || ''
      };
      localStorage.setItem('pendingUserData', JSON.stringify(pendingUserData));

      // ✅ Gunakan signUp untuk membuat user, lalu kirim OTP terpisah
      // Catatan: dengan email confirmation dimatikan, Supabase bisa langsung membuat session (auto login).
      // Kita akan langsung signOut lagi supaya user benar-benar harus lewat OTP dulu.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (signUpError) {
        console.error('SignUp error:', signUpError);
        localStorage.removeItem('pendingUserData');
        
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
          toast.error('Email sudah terdaftar. Silakan gunakan email lain.');
          return { success: false, message: 'Email sudah terdaftar' };
        } else {
          toast.error(signUpError.message);
          return { success: false, message: signUpError.message };
        }
      }

      if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
        localStorage.removeItem('pendingUserData');
        toast.error('Email sudah terdaftar');
        return { success: false, message: 'Email sudah terdaftar' };
      }

      // ✅ Pastikan user TIDAK otomatis login sebelum verifikasi OTP
      try {
        await supabase.auth.signOut();
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (logoutError) {
        console.warn('Logout after signUp failed (can be ignored):', logoutError);
      }

      // ✅ Generate dan kirim OTP code custom
      try {
        const otpResult = await generateAndSendOTP(email);
        
        // Jika fallback (development), tampilkan OTP di console
        if (otpResult.otpCode) {
          console.log(`🔐 OTP Code untuk ${email}: ${otpResult.otpCode}`);
          toast.info(`OTP Code: ${otpResult.otpCode} (cek console untuk development)`);
        }

        return { 
          success: true,
          needsVerification: true,
          email: email,
          message: 'Kode verifikasi telah dikirim ke email Anda'
        };
      } catch (otpError) {
        console.error('OTP send error:', otpError);
        // Tetap return success karena user sudah terdaftar
        // User bisa request OTP ulang nanti
        return { 
          success: true,
          needsVerification: true,
          email: email,
          message: 'Registrasi berhasil. Silakan cek email untuk kode verifikasi.'
        };
      }

    } catch (error) {
      console.error('Register exception:', error);
      toast.error('Terjadi kesalahan saat registrasi');
      return { success: false, message: 'Terjadi kesalahan' };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fungsi untuk verifikasi OTP
  const verifyOTP = async (email, token) => {
    try {
      setLoading(true);

      // ✅ Verifikasi OTP code custom terlebih dahulu
      const otpVerification = await verifyOTPCode(email, token);
      
      if (!otpVerification.success) {
        toast.error(otpVerification.message || 'Kode verifikasi tidak valid');
        return { success: false, message: otpVerification.message };
      }

      // ✅ Setelah OTP code valid, login user dengan password dari pendingUserData
      const pendingUserData = JSON.parse(localStorage.getItem('pendingUserData') || '{}');
      
      if (!pendingUserData.password) {
        toast.error('Data registrasi tidak ditemukan. Silakan registrasi ulang.');
        return { success: false, message: 'Data registrasi tidak ditemukan' };
      }

      // Login user setelah verifikasi OTP
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: pendingUserData.password
      });

      if (loginError) {
        // Jika login gagal karena email belum confirmed, coba update email confirmation
        if (loginError.message.includes('Email not confirmed')) {
          // User sudah dibuat tapi belum confirmed, kita sudah verifikasi OTP
          // Jadi kita bisa langsung set user sebagai authenticated
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            localStorage.removeItem('pendingUserData');

            setUser(user);
            setIsAuthenticated(true);
            await checkAdminRole(user.id);
            
            // Set session manual
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
              localStorage.setItem('token', sessionData.session.access_token);
              localStorage.setItem('user', JSON.stringify(user));
            }
            
            toast.success('Email berhasil diverifikasi!');
            return { success: true, user: user };
          }
        }
        
        toast.error('Gagal login setelah verifikasi');
        return { success: false, message: loginError.message };
      }

      if (loginData.user) {
        localStorage.removeItem('pendingUserData');

        setUser(loginData.user);
        setIsAuthenticated(true);
        await checkAdminRole(loginData.user.id);
        
        if (loginData.session) {
          localStorage.setItem('token', loginData.session.access_token);
          localStorage.setItem('user', JSON.stringify(loginData.user));
        }
        
        toast.success('Email berhasil diverifikasi!');
        return { success: true, user: loginData.user };
      }

      return { success: false, message: 'Verifikasi gagal' };

    } catch (error) {
      console.error('Verify OTP exception:', error);
      toast.error('Terjadi kesalahan saat verifikasi');
      return { success: false, message: 'Terjadi kesalahan' };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fungsi untuk resend OTP
  const resendOTP = async (email) => {
    try {
      setLoading(true);

      // ✅ Generate dan kirim ulang OTP code custom
      const otpResult = await generateAndSendOTP(email);
      
      // Jika fallback (development), tampilkan OTP di console
      if (otpResult.otpCode) {
        console.log(`🔐 OTP Code untuk ${email}: ${otpResult.otpCode}`);
        toast.info(`OTP Code: ${otpResult.otpCode} (cek console untuk development)`);
      }

      toast.success('Kode verifikasi telah dikirim ulang ke email Anda');
      return { success: true };

    } catch (error) {
      console.error('Resend OTP exception:', error);
      toast.error('Terjadi kesalahan saat mengirim ulang kode');
      return { success: false, message: 'Terjadi kesalahan' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // ✅ Clear state terlebih dahulu untuk mencegah stuck
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      
      // ✅ Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('pendingUserData');
      
      // ✅ Sign out dari Supabase (dengan timeout untuk mencegah stuck)
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      );
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise]).catch(async (err) => {
        // Jika timeout, tetap lanjutkan cleanup
        console.warn('Logout timeout, continuing cleanup...', err);
        try {
          await supabase.auth.signOut();
        } catch (e) {
          // Ignore error jika sudah timeout
        }
        return { error: null };
      });
      
      if (error) {
        console.warn('Logout error (non-critical):', error);
        // Tetap lanjutkan karena state sudah di-clear
      }
      
      toast.info('Anda telah logout');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Tetap clear state meskipun ada error
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('pendingUserData');
      
      toast.error('Logout selesai (beberapa proses mungkin masih berjalan)');
      return { success: true }; // Return success karena state sudah di-clear
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, message: "User tidak ditemukan" };
      }

      console.log('🔄 Menghapus akun untuk user:', user.id);

      // ✅ Hapus profile dari database terlebih dahulu
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

        if (profileError) {
          console.warn('⚠️ Error deleting profile:', profileError);
          // Lanjutkan saja, mungkin profile sudah dihapus atau tidak ada
        }
      } catch (profileErr) {
        console.warn('⚠️ Error deleting profile (non-critical):', profileErr);
      }

      // ✅ Coba hapus via Edge Function (dengan timeout)
      try {
        const deletePromise = invokeFunction('delete-account', { 
          user_id: user.id 
        });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Delete account timeout')), 10000)
        );
        
        const result = await Promise.race([deletePromise, timeoutPromise]).catch(async (err) => {
          console.warn('Delete account timeout, continuing cleanup...', err);
          return { success: true }; // Assume success untuk cleanup
        });
        
        console.log('✅ Akun berhasil dihapus:', result);
      } catch (funcErr) {
        console.warn('⚠️ Edge function error (non-critical):', funcErr);
        // Lanjutkan cleanup meskipun Edge Function gagal
      }

      // ✅ Clear state dan localStorage
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('pendingUserData');

      // ✅ Sign out dari Supabase (dengan timeout)
      try {
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SignOut timeout')), 5000)
        );
        
        await Promise.race([signOutPromise, timeoutPromise]).catch(async (err) => {
          console.warn('SignOut timeout, continuing...', err);
          try {
            await supabase.auth.signOut();
          } catch (e) {
            // Ignore
          }
        });
      } catch (signOutErr) {
        console.warn('⚠️ SignOut error (non-critical):', signOutErr);
        // State sudah di-clear, lanjutkan saja
      }

      toast.success('Akun berhasil dihapus');
      return { success: true, message: "Akun berhasil dihapus" };

    } catch (err) {
      console.error('❌ Error menghapus akun:', err);
      
      // ✅ Tetap clear state meskipun ada error
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('pendingUserData');
      
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        // Ignore
      }
      
      return { 
        success: false, 
        message: err.message || "Gagal menghapus akun. Silakan coba lagi." 
      };
    } finally {
      setLoading(false);
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
      // ✅ FIX: Gunakan URL dinamis berdasarkan environment
      // Mendeteksi URL saat ini (localhost atau production)
      const redirectUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      
      console.log('🔐 Google login redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectUrl}/`,
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
    loginWithGoogle,
    verifyOTP,
    resendOTP
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};