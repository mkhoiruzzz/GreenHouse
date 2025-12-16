import { supabase } from '../lib/supabase';
import emailjs from '@emailjs/browser';

// ✅ Generate OTP code 6 digit
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ Simpan OTP ke database (table email_verifications) atau localStorage sebagai fallback
export const saveOTP = async (email, otpCode) => {
  try {
    // Hapus OTP lama untuk email yang sama
    await supabase
      .from('email_verifications')
      .delete()
      .eq('email', email);

    // Simpan OTP baru dengan expiry 10 menit
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error } = await supabase
      .from('email_verifications')
      .insert([
        {
          email: email,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.warn('Error saving OTP to database (using localStorage fallback):', error);
      // Fallback: simpan di localStorage
      const otpData = {
        email: email,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString()
      };
      localStorage.setItem(`otp_${email}`, JSON.stringify(otpData));
      return { success: true, fallback: true };
    }

    return { success: true };
  } catch (error) {
    console.warn('Failed to save OTP to database (using localStorage fallback):', error);
    // Fallback: simpan di localStorage
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    const otpData = {
      email: email,
      otp_code: otpCode,
      expires_at: expiresAt.toISOString()
    };
    localStorage.setItem(`otp_${email}`, JSON.stringify(otpData));
    return { success: true, fallback: true };
  }
};

// ✅ Verifikasi OTP code
export const verifyOTPCode = async (email, otpCode) => {
  try {
    // Coba verifikasi dari database
    const { data, error } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otpCode)
      .single();

    if (error || !data) {
      // Fallback: cek dari localStorage
      const storedOTP = localStorage.getItem(`otp_${email}`);
      if (storedOTP) {
        const otpData = JSON.parse(storedOTP);
        if (otpData.otp_code === otpCode) {
          const expiresAt = new Date(otpData.expires_at);
          const now = new Date();
          
          if (now > expiresAt) {
            localStorage.removeItem(`otp_${email}`);
            return { success: false, message: 'Kode OTP sudah kadaluarsa' };
          }
          
          localStorage.removeItem(`otp_${email}`);
          return { success: true };
        }
      }
      
      return { success: false, message: 'Kode OTP tidak valid' };
    }

    // Cek apakah OTP sudah expired
    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      // Hapus OTP yang expired
      await supabase
        .from('email_verifications')
        .delete()
        .eq('email', email)
        .eq('otp_code', otpCode);

      return { success: false, message: 'Kode OTP sudah kadaluarsa' };
    }

    // Hapus OTP setelah digunakan
    await supabase
      .from('email_verifications')
      .delete()
      .eq('email', email)
      .eq('otp_code', otpCode);

    // Juga hapus dari localStorage jika ada
    localStorage.removeItem(`otp_${email}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    // Fallback: cek dari localStorage
    const storedOTP = localStorage.getItem(`otp_${email}`);
    if (storedOTP) {
      const otpData = JSON.parse(storedOTP);
      if (otpData.otp_code === otpCode) {
        const expiresAt = new Date(otpData.expires_at);
        const now = new Date();
        
        if (now > expiresAt) {
          localStorage.removeItem(`otp_${email}`);
          return { success: false, message: 'Kode OTP sudah kadaluarsa' };
        }
        
        localStorage.removeItem(`otp_${email}`);
        return { success: true };
      }
    }
    
    return { success: false, message: 'Terjadi kesalahan saat verifikasi' };
  }
};

// ✅ Kirim OTP via email menggunakan EmailJS
export const sendOTPEmail = async (email, otpCode) => {
  try {
    const EMAILJS_SERVICE_ID = 'service_t9g74el';
    const EMAILJS_TEMPLATE_ID = 'template_oldo1ke';
    const EMAILJS_PUBLIC_KEY = 'tAM6BbqC9NJgJnfc_';

    const templateParams = {
      to_email: email,
      otp_code: otpCode
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('EmailJS OTP result:', result.status, result.text);
    return { success: true, fallback: false };
  } catch (error) {
    console.error('Failed to send OTP email via EmailJS:', error);
    // Fallback: tampilkan OTP di console untuk development
    console.log(`🔐 OTP Code for ${email}: ${otpCode}`);
    return { success: true, fallback: true };
  }
};

// ✅ Generate dan kirim OTP
export const generateAndSendOTP = async (email) => {
  try {
    const otpCode = generateOTP();
    
    // Simpan OTP ke database
    await saveOTP(email, otpCode);
    
    // Kirim OTP via email
    const emailResult = await sendOTPEmail(email, otpCode);
    
    return { success: true, otpCode: emailResult.fallback ? otpCode : null };
  } catch (error) {
    console.error('Failed to generate and send OTP:', error);
    throw error;
  }
};

