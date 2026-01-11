import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase'; // ✅ REMOVE invokeFunction
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
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Fungsi untuk fetch profile dari database dengan Timeout dan Bypass untuk Admin
  const fetchProfile = async (userId, userEmail = null) => {
    try {
      console.log('📡 Fetching profile for user:', userId, 'Email:', userEmail);

      // 🚨 BYPASS KHUSUS ADMIN UNTUK MENGHINDARI INFINITE RECURSION RLS
      if (userEmail === 'admin@example.com') {
        console.log('🛡️ Admin detected, bypassing DB fetch to prevent RLS recursion');
        const mockAdminProfile = {
          id: userId,
          email: 'admin@example.com',
          username: 'admin',
          full_name: 'Administrator',
          role: 'admin', // Penting
          updated_at: new Date().toISOString()
        };
        setProfile(mockAdminProfile);
        return mockAdminProfile;
      }

      // Create a specific timeout for profile fetch
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile Fetch Timeout')), 5000)
      );

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        console.error('❌ Error fetching profile:', error);
        return null;
      }

      console.log('✅ Profile fetched:', data);
      setProfile(data);
      return data;
    } catch (error) {
      console.error('❌ Exception fetching profile (timeout/network):', error);
      return null;
    }
  };

  const checkAdminRole = async (userId, userEmail = null) => {
    try {
      console.log('🔍 Checking admin role for user:', userId);

      let email = userEmail;

      if (!email) {
        console.log('⚠️ No email provided to checkAdminRole, fetching user...');
        const { data: userData } = await supabase.auth.getUser();
        email = userData.user?.email;
      }

      console.log('📧 User email:', email);

      if (email === 'admin@example.com') {
        console.log('🎯 TEMPORARY: FORCE ADMIN for admin@example.com');
        setIsAdmin(true);
        return true;
      }

      console.log('❌ User is NOT admin');
      setIsAdmin(false);
      return false;

    } catch (error) {
      console.error('💥 Error in checkAdminRole:', error);

      // Fallback check logic in case of error
      try {
        // If we have local user state, check that
        if (user?.email === 'admin@example.com') {
          setIsAdmin(true);
          return true;
        }
      } catch (e) { }

      setIsAdmin(false);
      return false;
    }
  };

  const ensureUserProfile = async (userData) => {
    try {
      console.log('🔄 Ensuring profile exists for user:', userData.id);

      // 🚨 BYPASS ADMIN
      if (userData.email === 'admin@example.com') {
        console.log('🛡️ Admin detected, skipping ensureUserProfile to prevent RLS recursion');
        return true;
      }

      const profileData = {
        id: userData.id,
        email: userData.email || '',
        username: userData.user_metadata?.username || userData.email?.split('@')[0] || 'user',
        full_name: userData.user_metadata?.full_name || userData.user_metadata?.name || '',
        phone: userData.user_metadata?.phone || '',
        address: userData.user_metadata?.address || '',
        city: userData.user_metadata?.city || '',
        province: userData.user_metadata?.province || '',
        role: userData.user_metadata?.role || 'customer'
      };

      // Add timeout for upsert
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile Ensure Timeout')), 5000)
      );

      const upsertPromise = supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      const { error: upsertError } = await Promise.race([upsertPromise, timeoutPromise]);

      if (upsertError) {
        console.error('❌ Error creating/updating profile:', upsertError);
        return false;
      }

      console.log('✅ Profile ensured for user:', userData.id);
      return true;
    } catch (error) {
      console.error('❌ Error in ensureUserProfile:', error);
      return false;
    }
  };

  // ✅ PERBAIKAN checkAuth dengan localStorage cache
  const checkAuth = async () => {
    try {
      console.log('🔐 Checking auth session...');

      // ✅ CEK LOCALSTORAGE PERTAMA
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      console.log('📦 Stored user:', storedUser ? 'Yes' : 'No');
      console.log('📦 Stored token:', storedToken ? 'Yes' : 'No');

      if (storedUser && storedToken) {
        console.log('⚡ Using cached auth data');
        const userData = JSON.parse(storedUser);

        // Fetch profile dengan cached user DULU
        await fetchProfile(userData.id, userData.email);
        await checkAdminRole(userData.id, userData.email);

        // BARU SET STATE
        setUser(userData);
        setIsAuthenticated(true);

        // ✅ VERIFY SESSION MASIH VALID
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('⚠️ Cached session expired, refreshing...');
          await supabase.auth.refreshSession();
        }

        setLoading(false);
        return;
      }

      // ✅ JIKA TIDAK ADA CACHE, CHECK SESSION
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Session check error:', error);
        throw error;
      }

      console.log('🔍 Supabase session:', session ? 'Exists' : 'Null');

      if (session) {
        const userData = session.user;
        console.log('✅ User authenticated:', userData.email);

        // ✅ FETCH PROFILE & CHECK ROLE SEBELUM SET AUTH
        await fetchProfile(userData.id, userData.email);
        await checkAdminRole(userData.id, userData.email);

        setUser(userData);
        setIsAuthenticated(true);

        // ✅ SIMPAN KE LOCALSTORAGE
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('💾 Saved to localStorage');

      } else {
        console.log('❌ No active session');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔁 Auth state changed:', event, 'Session:', !!session);

        if (session) {
          const userData = session.user;
          console.log('👤 User:', userData.email);

          setUser(userData);
          setIsAuthenticated(true);

          // ✅ SIMPAN SEBELUM FETCH PROFILE
          localStorage.setItem('token', session.access_token);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('💾 Auth state saved to localStorage');

          // ✅ FETCH PROFILE
          await fetchProfile(userData.id, userData.email);

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setTimeout(async () => {
              await ensureUserProfile(userData);
              await fetchProfile(userData.id, userData.email);
            }, 1000);
          }

          await checkAdminRole(userData.id, userData.email);

        } else {
          console.log('🚪 No session, clearing auth');
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setIsAdmin(false);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Jangan hapus pendingUserData di sini karena signup memicu signOut
          // yang akan menghapus data yang dibutuhkan untuk verifikasi OTP
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login for:', email);

      if (!email || !password) {
        toast.error('Email dan password wajib diisi');
        return { success: false, message: 'Email dan password wajib diisi' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (error) {
        console.error('❌ Login error:', error);

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
        console.log('✅ Login successful:', userData.email);

        // ✅ SIMPAN KE LOCALSTORAGE DULU
        localStorage.setItem('token', data.session.access_token);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('💾 Login data saved to localStorage');

        // ✅ FETCH PROFILE & CHECK ROLE DULU SEBELUM SET AUTH
        // Ini penting agar saat isAuthenticated = true, isAdmin sudah valid
        await fetchProfile(userData.id, userData.email);
        const isAdminUser = await checkAdminRole(userData.id, userData.email);
        console.log('👮 Admin check result:', isAdminUser);

        // ✅ BARU SET STATE
        setUser(userData);
        setIsAuthenticated(true);
        // setIsAdmin sudah di-set di dalam checkAdminRole, tapi kita pastikan urutannya aman

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

      try {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (logoutError) {
        console.warn('Logout after signUp failed (can be ignored):', logoutError);
      }

      try {
        console.log('📧 Generating and sending OTP for:', email);
        const otpResult = await generateAndSendOTP(email);
        console.log('✅ OTP sent result:', otpResult);

        if (otpResult && otpResult.otpCode) {
          console.log(`🔐 OTP Code untuk ${email}: ${otpResult.otpCode}`);
          toast.info(`OTP Code: ${otpResult.otpCode} (cek console untuk development)`);
        }

        console.log('✅ Returning success with needsVerification: true');
        return {
          success: true,
          needsVerification: true,
          email: email,
          message: 'Kode verifikasi telah dikirim ke email Anda'
        };
      } catch (otpError) {
        console.error('❌ OTP send error:', otpError);
        return {
          success: true,
          needsVerification: true,
          email: email,
          message: 'Registrasi berhasil. Silakan cek email untuk kode verifikasi atau klik "Kirim ulang kode".'
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

  const verifyOTP = async (email, token) => {
    try {
      setLoading(true);

      const otpVerification = await verifyOTPCode(email, token);

      if (!otpVerification.success) {
        toast.error(otpVerification.message || 'Kode verifikasi tidak valid');
        return { success: false, message: otpVerification.message };
      }

      const pendingUserData = JSON.parse(localStorage.getItem('pendingUserData') || '{}');

      if (!pendingUserData.password) {
        toast.error('Data registrasi tidak ditemukan. Silakan registrasi ulang.');
        return { success: false, message: 'Data registrasi tidak ditemukan' };
      }

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: pendingUserData.password
      });

      if (loginError) {
        if (loginError.message.includes('Email not confirmed')) {
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            localStorage.removeItem('pendingUserData');

            setUser(user);
            setIsAuthenticated(true);
            await fetchProfile(user.id);
            await checkAdminRole(user.id);

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
        await fetchProfile(loginData.user.id);
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

  const resendOTP = async (email) => {
    try {
      setLoading(true);

      const otpResult = await generateAndSendOTP(email);

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

      // ✅ Clear state terlebih dahulu
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setIsAdmin(false);

      // ✅ Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('pendingUserData');

      // ✅ Sign out dari Supabase
      try {
        await supabase.auth.signOut();
        console.log('✅ Logout successful');
      } catch (signOutError) {
        console.warn('⚠️ SignOut error (non-critical):', signOutError);
      }

      toast.info('Anda telah logout');
      return { success: true };

    } catch (error) {
      console.error('Logout error:', error);

      // Tetap clear state meskipun ada error
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('pendingUserData');

      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setLoading(true);
      console.log('🗑️ Starting account deletion process...');

      const { data: { user: currentUser }, error: getUserError } = await supabase.auth.getUser();

      if (getUserError || !currentUser) {
        console.error('❌ Error getting user:', getUserError);
        return { success: false, message: "User tidak ditemukan" };
      }

      console.log('🔄 Menghapus akun untuk user:', currentUser.id, currentUser.email);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session');
        }

        console.log('📞 Calling delete-account Edge Function...');
        const { data: functionData, error: functionError } = await supabase.functions.invoke(
          'delete-account',
          {
            body: { user_id: currentUser.id },
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        );

        if (functionError) {
          console.error('❌ Edge Function error:', functionError);
          throw new Error(functionError.message || 'Failed to delete user from Auth');
        }

        console.log('✅ User deleted from Auth:', functionData);
      } catch (edgeFunctionError) {
        console.error('❌ Error calling Edge Function:', edgeFunctionError);
        console.warn('⚠️ Falling back to data cleanup only');
      }

      try {
        const cleanupResult = await accountService.completeDataCleanup(currentUser.id, currentUser.email);
        console.log('✅ Account cleanup result:', cleanupResult);
      } catch (cleanupErr) {
        console.warn('⚠️ Cleanup error (non-critical):', cleanupErr);
      }

      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('pendingUserData');
      sessionStorage.clear();

      try {
        await supabase.auth.signOut();
        console.log('✅ Signed out from Supabase');
      } catch (signOutErr) {
        console.warn('⚠️ SignOut error (non-critical):', signOutErr);
      }

      toast.success('Akun berhasil dihapus');
      return { success: true, message: "Akun berhasil dihapus" };

    } catch (err) {
      console.error('❌ Error menghapus akun:', err);

      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('pendingUserData');
      sessionStorage.clear();

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

  // ✅ updateProfile dengan proper data handling
  const updateProfile = async (profileData) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        return { success: false, message: 'User tidak ditemukan' };
      }

      const now = new Date().toISOString();

      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          email: currentUser.email,
          username: profileData.username,
          full_name: profileData.full_name,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          province: profileData.province,
          updated_at: now
        }, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // ✅ UPDATE profile state dengan data yang baru
      setProfile(updatedProfile);
      console.log('✅ Profile state updated:', updatedProfile);

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

      return { success: true, message: 'Profil berhasil diperbarui', data: updatedProfile };
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

  const refreshProfile = async () => {
    if (!user?.id) return null;
    console.log('🔄 Force refreshing profile for:', user.id);
    return await fetchProfile(user.id);
  };

  const value = {
    user,
    profile,
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
    resendOTP,
    fetchProfile,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};