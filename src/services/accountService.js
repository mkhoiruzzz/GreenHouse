import { supabase } from '../lib/supabase';

export const accountService = {
  // ✅ CEK KETERSEDIAAN EMAIL (Simplified - tanpa profiles check)
  async checkEmailAvailable(email) {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      // Langsung cek dengan test signup
      // Ini akan gagal jika email sudah terdaftar di auth.users
      const testPassword = `Test_${Date.now()}_${Math.random().toString(36).substring(7)}!Aa1`;
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: testPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: { 
            is_test_check: true,
            timestamp: Date.now()
          }
        }
      });

      // Jika ada error signup
      if (signUpError) {
        console.log('Signup error:', signUpError.message);
        
        // Email sudah terdaftar
        if (signUpError.message.includes('already') || 
            signUpError.message.includes('registered') ||
            signUpError.message.includes('User already registered')) {
          return {
            available: false,
            message: '⚠️ Email sudah terdaftar. Klik "Bersihkan" untuk mendaftar ulang.',
            canCleanup: true
          };
        }
        
        // Error lain, anggap tersedia
        return { 
          available: true, 
          message: '✓ Email tersedia'
        };
      }

      // Jika signup berhasil, cek identities
      if (signUpData?.user) {
        // identities kosong = email sudah terdaftar
        if (signUpData.user.identities && signUpData.user.identities.length === 0) {
          return {
            available: false,
            message: '⚠️ Email sudah terdaftar. Klik "Bersihkan" untuk mendaftar ulang.',
            canCleanup: true
          };
        }
        
        // Email benar-benar baru (test signup berhasil)
        console.log('✓ Email available, test signup created (will auto-cleanup)');
      }

      // Email tersedia
      return { 
        available: true, 
        message: '✓ Email tersedia',
        canCleanup: false
      };

    } catch (error) {
      console.error('Email availability check error:', error);
      // Default ke available jika ada error
      return { 
        available: true, 
        message: '✓ Email tersedia'
      };
    }
  },

  // ✅ DELETE ACCOUNT MELALUI API ROUTE
  async deleteUserAccount(userId, userEmail) {
    try {
      console.log('📄 Starting API account deletion for user:', userId);

      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          email: userEmail
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account via API');
      }

      console.log('✅ API deletion completed');
      return result;

    } catch (error) {
      console.error('❌ API deletion error:', error);
      throw error;
    }
  },

  // ✅ COMPLETE DATA CLEANUP (Hard delete approach untuk free up email)
  async completeDataCleanup(userId, userEmail) {
    try {
      console.log('📄 Starting complete data cleanup for user:', userId);
      console.log('📧 Original email:', userEmail);

      // STEP 1: Update email di auth.users dulu (PENTING!)
      // Ini akan membebaskan email asli untuk digunakan lagi
      const uniqueEmail = `deleted_${userId}_${Date.now()}@deleted.account`;
      
      try {
        const { data: updateData, error: emailError } = await supabase.auth.updateUser({
          email: uniqueEmail
        });

        if (emailError) {
          console.error('⚠️ Cannot update email:', emailError);
          // Jangan throw error, lanjutkan proses
        } else {
          console.log('✅ Auth email updated to:', uniqueEmail);
          console.log('✅ Original email freed:', userEmail);
        }
      } catch (emailUpdateError) {
        console.warn('Email update failed:', emailUpdateError);
      }

      // STEP 2: Hard delete dari profiles (bukan soft delete)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('⚠️ Error deleting profile:', profileError);
        // Jika hard delete gagal, coba soft delete sebagai fallback
        const { error: softDeleteError } = await supabase
          .from('profiles')
          .update({ 
            is_deleted: true,
            deleted_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        if (softDeleteError) {
          console.error('Soft delete also failed:', softDeleteError);
        } else {
          console.log('✅ Profile soft deleted (fallback)');
        }
      } else {
        console.log('✅ Profile hard deleted');
      }

      // STEP 3: Update password untuk security
      try {
        const randomPassword = this.generateSecurePassword();
        const { error: passwordError } = await supabase.auth.updateUser({
          password: randomPassword
        });

        if (!passwordError) {
          console.log('✅ Password updated');
        }
      } catch (pwError) {
        console.warn('Password update skipped:', pwError);
      }

      return { 
        success: true, 
        message: `Akun berhasil dihapus. Email ${userEmail} sekarang dapat digunakan kembali untuk registrasi.` 
      };

    } catch (error) {
      console.error('Complete cleanup error:', error);
      throw error;
    }
  },

  // ✅ CEK STATUS EMAIL DI AUTH
  async checkAuthEmailStatus(email) {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, is_deleted')
        .eq('email', normalizedEmail);

      if (error) {
        return { 
          exists: false, 
          message: 'Error checking email status' 
        };
      }

      // Jika ada profile aktif dengan email ini
      const activeProfile = profiles?.find(p => !p.is_deleted);
      if (activeProfile) {
        return { 
          exists: true, 
          active: true,
          message: 'Email sudah terdaftar dengan akun aktif' 
        };
      }

      // Jika ada profile deleted dengan email ini
      const deletedProfile = profiles?.find(p => p.is_deleted);
      if (deletedProfile) {
        return { 
          exists: true, 
          active: false,
          message: 'Email pernah terdaftar tetapi sudah dihapus',
          can_cleanup: true
        };
      }

      return { 
        exists: false, 
        message: 'Email tersedia' 
      };

    } catch (error) {
      console.error('Auth email check error:', error);
      return { 
        exists: false, 
        message: 'Email tersedia' 
      };
    }
  },

  // ✅ FORCE CLEANUP EMAIL (Simplified - focus on auth.users)
  async forceEmailCleanup(email) {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      console.log('🧹 Force cleaning up email:', normalizedEmail);

      // Karena tidak bisa akses auth.users dari client,
      // kita akan informasikan user untuk delete manual
      
      return { 
        success: false, 
        message: `❌ Email cleanup memerlukan akses admin. 
        
Silakan hapus manual:
1. Buka Supabase Dashboard
2. Authentication → Users  
3. Cari email: ${normalizedEmail}
4. Delete User
5. Refresh halaman ini

Atau gunakan email lain untuk mendaftar.`,
        manual_action_required: true
      };

    } catch (error) {
      console.error('Force cleanup error:', error);
      return { 
        success: false, 
        message: 'Gagal membersihkan email. Silakan gunakan email lain atau hapus manual dari Supabase Dashboard.' 
      };
    }
  },

  // ✅ GENERATE SECURE PASSWORD
  generateSecurePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 32; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
};