import { supabase } from '../lib/supabase';

export const supabaseAuth = {
  // Register dengan Supabase
  async register(userData) {
    try {
      const { email, password, nama_lengkap, no_telepon, alamat, kota, provinsi, username } = userData;

      // 1. Register user dengan Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            full_name: nama_lengkap,
            phone: no_telepon,
            address: alamat,
            city: kota,
            province: provinsi
          }
        }
      });

      if (authError) throw new Error(authError.message);

      // 2. Jika register berhasil, buat profile di table profiles
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email,
              username: username,
              full_name: nama_lengkap,
              phone: no_telepon,
              address: alamat,
              city: kota,
              province: provinsi,
              created_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Lanjutkan saja, user sudah terdaftar di auth
        }
      }

      return { 
        success: true, 
        message: 'Registrasi berhasil! Silakan cek email untuk verifikasi.',
        user: authData.user 
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Login dengan Supabase
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw new Error(error.message);

      return { 
        success: true, 
        user: data.user,
        session: data.session 
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Logout
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  // Get current user
  getCurrentUser() {
    return supabase.auth.getUser();
  },

  // Check if user is authenticated
  async isAuthenticated() {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }
};