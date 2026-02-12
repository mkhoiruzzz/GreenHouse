import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { accountService } from '../services/accountService';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        nama_lengkap: '',
        no_telepon: '',
        alamat: '',
        kota: '',
        provinsi: ''
    });
    const [loading, setLoading] = useState(false);
    const [emailChecking, setEmailChecking] = useState(false);
    const [emailAvailable, setEmailAvailable] = useState(null);
    const [emailMessage, setEmailMessage] = useState('');
    const [showCleanupOption, setShowCleanupOption] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);

    const navigate = useNavigate();
    const { register, verifyOTP, resendOTP } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // ✅ DISABLE EMAIL CHECKING TEMPORARILY
    useEffect(() => {
        // Set email as always available (no checking)
        setEmailAvailable(true);
        setEmailMessage('');
        setShowCleanupOption(false);
    }, [formData.email]);

    // ✅ FUNGSI CLEANUP EMAIL STUCK (DISABLED FOR NOW)
    const handleCleanupEmail = async () => {
        try {
            setEmailChecking(true);
            toast.info('Silakan hapus user manual dari Supabase Dashboard: Authentication → Users');
        } catch (error) {
            toast.error('Gagal membersihkan email');
        } finally {
            setEmailChecking(false);
        }
    };

    // ✅ FUNGSI UNTUK CREATE PROFILE SETELAH REGISTER
    const createUserProfile = async (userId, userData) => {
        try {
            console.log('🔄 Creating profile for user:', userId);
            console.log('📝 Profile data:', userData);

            const profileData = {
                id: userId,
                email: userData.email,
                username: userData.username || '',
                full_name: userData.nama_lengkap || '',
                phone: userData.no_telepon || '',
                address: userData.alamat || '',
                city: userData.kota || '',
                province: userData.provinsi || '',
                role: 'customer'
                // Jangan set created_at/updated_at manual, biarkan database handle
            };

            // ✅ Gunakan upsert supaya tidak error kalau profil dengan id yang sama sudah ada
            const { data, error } = await supabase
                .from('profiles')
                .upsert(profileData, { onConflict: 'id' })
                .select();

            if (error) {
                console.error('❌ Error creating profile:', error);
                console.error('❌ Error details:', JSON.stringify(error, null, 2));
                throw error;
            }

            console.log('✅ Profile created/updated successfully:', data);

            // ✅ Verifikasi data benar-benar tersimpan
            const { data: verifyData, error: verifyError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (verifyError) {
                console.warn('⚠️ Warning: Could not verify profile creation:', verifyError);
            } else {
                console.log('✅ Profile verified in database:', verifyData);
            }

            return true;
        } catch (error) {
            console.error('❌ Failed to create profile:', error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validasi form
        if (!formData.email || !formData.password || !formData.username) {
            toast.error('Email, username, dan password wajib diisi');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Password dan konfirmasi password tidak cocok');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password minimal 6 karakter');
            return;
        }

        // ✅ Validasi No. Telepon (Format Indonesia)
        if (formData.no_telepon) {
            const phoneRegex = /^08[1-9][0-9]{7,10}$/;
            if (!phoneRegex.test(formData.no_telepon)) {
                toast.error('Nomor telepon tidak valid (contoh: 081234567890)');
                return;
            }

            // Tambahan: block urutan angka sederhana jika dimulai 08 tapi sisa angka berurutan (opsional tapi bagus)
            const simpleSequence = "01234567890123456789";
            if (simpleSequence.includes(formData.no_telepon.slice(2))) {
                toast.error('Nomor telepon tidak boleh urutan angka sederhana');
                return;
            }
        }

        setLoading(true);

        try {
            const { confirmPassword, ...registerData } = formData;

            console.log('🔄 Starting registration for:', registerData.email);
            const result = await register(registerData);
            console.log('📋 Registration result:', result);

            if (result && result.success) {
                // ✅ Reset loading state terlebih dahulu sebelum beralih ke verification
                setLoading(false);

                if (result.needsVerification) {
                    // ✅ Tampilkan form verifikasi OTP
                    console.log('✅ Registration successful, showing verification form');
                    setNeedsVerification(true);
                    setVerificationEmail(result.email || formData.email);
                    toast.success(result.message || 'Kode verifikasi telah dikirim ke email Anda');
                } else if (result.user) {
                    // ✅ BUAT PROFILE SETELAH REGISTER BERHASIL (jika tidak perlu verifikasi)
                    try {
                        await createUserProfile(result.user.id, registerData);
                        toast.success('Registrasi berhasil! Profil telah dibuat. Silakan login.');
                    } catch (profileError) {
                        console.error('Profile creation failed:', profileError);
                        toast.warning('Registrasi berhasil tetapi gagal membuat profil. Silakan lengkapi profil nanti.');
                    }

                    navigate('/login');
                } else {
                    // Fallback: jika tidak ada needsVerification atau user, tetap tampilkan form verifikasi
                    console.warn('⚠️ No needsVerification flag, defaulting to verification form');
                    setNeedsVerification(true);
                    setVerificationEmail(formData.email);
                    toast.info('Silakan verifikasi email Anda');
                }
            } else {
                console.error('❌ Registration failed:', result);
                toast.error(result?.message || 'Registrasi gagal');
            }
        } catch (error) {
            console.error('❌ Register component error:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                error: error
            });
            toast.error(error.message || 'Terjadi kesalahan sistem');
        } finally {
            // ✅ PASTIKAN loading selalu di-set ke false
            setLoading(false);
            console.log('✅ Registration process completed, loading set to false');
        }
    };

    // ✅ Handle verifikasi OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        if (!otpCode || otpCode.length < 6) {
            toast.error('Masukkan kode verifikasi 6 digit');
            return;
        }

        setVerifying(true);

        try {
            const result = await verifyOTP(verificationEmail, otpCode);

            if (result.success && result.user) {
                // ✅ BUAT PROFILE SETELAH VERIFIKASI BERHASIL
                const { confirmPassword, ...registerData } = formData;
                try {
                    await createUserProfile(result.user.id, registerData);
                    toast.success('Verifikasi berhasil! Profil telah dibuat.');
                } catch (profileError) {
                    console.error('Profile creation failed:', profileError);
                    toast.warning('Verifikasi berhasil tetapi gagal membuat profil. Silakan lengkapi profil nanti.');
                }

                // Redirect ke login setelah beberapa detik
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                toast.error(result.message || 'Verifikasi gagal');
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            toast.error('Terjadi kesalahan saat verifikasi');
        } finally {
            setVerifying(false);
        }
    };

    // ✅ Handle resend OTP
    const handleResendOTP = async () => {
        setResending(true);
        try {
            const result = await resendOTP(verificationEmail);
            if (result.success) {
                toast.success('Kode verifikasi telah dikirim ulang');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
        } finally {
            setResending(false);
        }
    };

    // ✅ Jika perlu verifikasi, tampilkan form verifikasi
    if (needsVerification) {
        return (
            <div className="min-h-screen mt-16 py-12 bg-gray-50">
                <div className="max-w-md mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-green-600 mb-2">Verifikasi Email</h1>
                            <p className="text-gray-600">
                                Masukkan kode verifikasi yang telah dikirim ke
                            </p>
                            <p className="text-gray-800 font-semibold mt-1">{verificationEmail}</p>
                        </div>

                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kode Verifikasi (6 digit)
                                </label>
                                <input
                                    type="text"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    disabled={verifying}
                                    maxLength={6}
                                    autoComplete="one-time-code"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 text-center text-2xl tracking-widest font-mono"
                                    placeholder="000000"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Masukkan 6 digit kode yang dikirim ke email Anda
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={verifying || otpCode.length !== 6}
                                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {verifying ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Memverifikasi...
                                    </span>
                                ) : (
                                    'Verifikasi'
                                )}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={resending}
                                    className="text-green-600 hover:text-green-700 font-semibold text-sm disabled:opacity-50"
                                >
                                    {resending ? 'Mengirim...' : 'Kirim ulang kode'}
                                </button>
                            </div>

                            <div className="text-center pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNeedsVerification(false);
                                        setOtpCode('');
                                    }}
                                    className="text-gray-500 hover:text-gray-700 text-sm"
                                >
                                    ← Kembali ke form registrasi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen mt-16 py-12 bg-gray-50">
            <div className="max-w-md mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-green-600 mb-2">Daftar</h1>
                        <p className="text-gray-600">Buat akun Green House baru</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50"
                                    placeholder="username"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50"
                                    placeholder="email@example.com"
                                />

                                {/* Note for stuck email */}
                                {emailMessage && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {emailMessage}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    autoComplete="new-password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50"
                                    placeholder="min. 6 karakter"
                                    minLength="6"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Konfirmasi Password *
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    autoComplete="new-passwprd"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50"
                                    placeholder="ulangi password"
                                    minLength="6"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                name="nama_lengkap"
                                value={formData.nama_lengkap}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50"
                                placeholder="nama lengkap"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                No. Telepon
                            </label>
                            <input
                                type="tel"
                                name="no_telepon"
                                value={formData.no_telepon}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50"
                                placeholder="08123456789"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alamat
                            </label>
                            <textarea
                                name="alamat"
                                value={formData.alamat}
                                onChange={handleChange}
                                disabled={loading}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50"
                                placeholder="alamat lengkap"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kota
                                </label>
                                <input
                                    type="text"
                                    name="kota"
                                    value={formData.kota}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50"
                                    placeholder="kota"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Provinsi
                                </label>
                                <input
                                    type="text"
                                    name="provinsi"
                                    value={formData.provinsi}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50"
                                    placeholder="provinsi"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Memproses...
                                </span>
                            ) : (
                                'Daftar'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Sudah punya akun?{' '}
                            <Link
                                to="/login"
                                className="text-green-600 hover:text-green-700 font-semibold"
                            >
                                Login di sini
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="text-center">
                            <Link
                                to="/"
                                className="text-gray-500 hover:text-green-600 text-sm"
                            >
                                ← Kembali ke Beranda
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;