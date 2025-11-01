import { supabase } from '../lib/supabase';

export const accountService = {
  // ✅ DELETE ACCOUNT DENGAN SERVICE ROLE KEY
  async deleteUserAccount(userId) {
    try {
      console.log('🔄 Starting account deletion for user:', userId);

      // 1. Hapus dari profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('❌ Error deleting profile:', profileError);
        throw new Error(`Gagal menghapus data profil: ${profileError.message}`);
      }

      // 2. Hapus dari tabel lain yang terkait (jika ada)
      await this.deleteUserRelatedData(userId);

      // 3. Hapus user dari auth (butuh service_role key)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('❌ Error deleting auth user:', authError);
        
        // Jika tidak punya akses admin, throw error khusus
        if (authError.message.includes('JWT')) {
          throw new Error('Tidak memiliki izin untuk menghapus akun. Silakan gunakan metode alternatif.');
        }
        throw new Error(`Gagal menghapus akun auth: ${authError.message}`);
      }

      console.log('✅ Account deletion completed successfully');
      return { 
        success: true, 
        message: 'Akun berhasil dihapus permanen' 
      };

    } catch (error) {
      console.error('❌ Account service deletion error:', error);
      throw error;
    }
  },

  // ✅ SOFT DELETE ALTERNATIVE YANG LEBIH BAIK
  async softDeleteAccount(userId) {
    try {
      console.log('🔄 Starting soft deletion for user:', userId);

      // 1. Hapus data sensitif dari profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: `deleted_${userId}@deleted.com`,
          username: `deleted_${userId}`,
          full_name: 'User Terhapus',
          phone: '0000000000',
          address: 'Data telah dihapus',
          city: 'Data telah dihapus',
          province: 'Data telah dihapus',
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        throw new Error(`Gagal update profil: ${profileError.message}`);
      }

      // 2. BUAT EMAIL UNIK YANG TIDAK AKAN PERNAH DIGUNAKAN
      const uniqueDeletedEmail = `deleted_${userId}_${Date.now()}@account.deleted`;
      
      // 3. Update email di auth - INI YANG PENTING!
      const { error: emailError } = await supabase.auth.updateUser({
        email: uniqueDeletedEmail
      });

      if (emailError) {
        console.warn('⚠️ Cannot update email:', emailError);
        // Jika gagal update email, coba approach lain
        await this.alternativeAccountDeactivation(userId);
      } else {
        console.log('✅ Email updated to:', uniqueDeletedEmail);
      }

      // 4. Update password untuk memastikan tidak bisa login
      const randomPassword = this.generateSecurePassword();
      const { error: passwordError } = await supabase.auth.updateUser({
        password: randomPassword
      });

      if (passwordError) {
        console.warn('⚠️ Cannot update password:', passwordError);
      }

      console.log('✅ Soft deletion completed');
      return { 
        success: true, 
        message: 'Akun berhasil dinonaktifkan. Email ini dapat digunakan untuk mendaftar kembali.' 
      };

    } catch (error) {
      console.error('❌ Soft deletion error:', error);
      throw error;
    }
  },

  // ✅ ALTERNATIVE JIKA UPDATE EMAIL GAGAL
  async alternativeAccountDeactivation(userId) {
    try {
      console.log('🔄 Using alternative deactivation method');
      
      // Hanya update password untuk memastikan tidak bisa login
      const randomPassword = this.generateSecurePassword();
      const { error } = await supabase.auth.updateUser({
        password: randomPassword
      });

      if (error) {
        throw new Error('Gagal menonaktifkan akun');
      }

      return true;
    } catch (error) {
      console.error('Alternative deactivation error:', error);
      throw error;
    }
  },

  // ✅ GENERATE PASSWORD YANG SANGAT AMAN
  generateSecurePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 32; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  },

  // ✅ HAPUS DATA TERKAIT USER DARI TABEL LAIN
  async deleteUserRelatedData(userId) {
    try {
      // Sesuaikan dengan tabel yang ada di database Anda
      const tables = [
        'orders', 
        'order_items', 
        'carts',
        'user_preferences',
        'user_sessions'
      ];
      
      for (const table of tables) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('user_id', userId);

          if (error && !error.message.includes('does not exist')) {
            console.warn(`⚠️ Warning deleting from ${table}:`, error);
          } else if (!error) {
            console.log(`✅ Deleted from ${table}`);
          }
        } catch (tableError) {
          console.warn(`⚠️ Error with table ${table}:`, tableError);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error deleting related data:', error);
    }
  },

  // ✅ CHECK IF USER CAN BE DELETED
  async checkDeletionEligibility(userId) {
    try {
      // Cek apakah user ada
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, is_deleted')
        .eq('id', userId)
        .single();

      if (error) {
        return { eligible: false, reason: 'User tidak ditemukan' };
      }

      if (profile.is_deleted) {
        return { eligible: false, reason: 'Akun sudah dinonaktifkan' };
      }

      return { eligible: true };
    } catch (error) {
      console.error('Check eligibility error:', error);
      return { eligible: false, reason: 'Error checking eligibility' };
    }
  },

  // ✅ FUNGSI BARU: CEK APAKAH EMAIL SUDAH TERDAFTAR TAPI DELETED
  async checkEmailAvailability(email) {
    try {
      // Cek di auth users (ini butuh admin privileges)
      // Untuk sekarang, kita cek di profiles table saja
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('id, email, is_deleted')
        .eq('email', email)
        .single();

      if (error && error.code === 'PGRST116') {
        // Tidak ada data, email available
        return { available: true };
      }

      if (existingProfile) {
        if (existingProfile.is_deleted) {
          return { 
            available: true, 
            message: 'Email ini sebelumnya pernah terdaftar tetapi sudah dihapus. Bisa digunakan kembali.' 
          };
        }
        return { available: false, message: 'Email sudah terdaftar' };
      }

      return { available: true };
    } catch (error) {
      console.error('Check email availability error:', error);
      return { available: true }; // Default to available jika error
    }
  }
};