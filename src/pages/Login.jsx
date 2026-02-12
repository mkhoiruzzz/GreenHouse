// src/pages/Login.jsx - With Dark Mode & Language Support
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FcGoogle } from 'react-icons/fc';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // ✅ Tambahkan icon mata

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // ✅ State untuk show/hide password

    const { login, loginWithGoogle, isAuthenticated, isAdmin, user } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    useEffect(() => {
        if (isAuthenticated) {
            if (isAdmin || user?.email === 'admin@example.com') {
                navigate('/admin', { replace: true });
            } else {
                navigate(from, { replace: true });
            }
        }
    }, [isAuthenticated, isAdmin, user, navigate, from]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            toast.error('Email dan password wajib diisi');
            return;
        }

        setLoading(true);
        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                setFormData({ email: '', password: '' });
            } else {
                toast.error(result.message || 'Login gagal');
            }
        } catch (error) {
            console.error('Login component error:', error);
            toast.error('Terjadi kesalahan sistem');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await loginWithGoogle();
        } catch (error) {
            toast.error('Gagal login dengan Google');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fungsi untuk toggle show/hide password
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen mt-16 py-12 bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-green-600 mb-2">
                            Login
                        </h1>
                        <p className="text-gray-600">
                            Masuk ke akun Green House Anda
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 bg-white text-gray-900"
                                placeholder="masukkan email Anda"
                            />
                        </div>

                        <div className="relative"> {/* ✅ Wrapper relative untuk icon */}
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"} // ✅ Toggle type
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 bg-white text-gray-900 pr-12"
                                    placeholder="masukkan password"
                                    minLength="6"
                                />
                                {/* ✅ Icon mata untuk toggle password visibility */}
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    disabled={loading}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 focus:outline-none disabled:opacity-50"
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {showPassword ? (
                                        <FaEyeSlash className="text-gray-500 hover:text-gray-700 text-xl" />
                                    ) : (
                                        <FaEye className="text-gray-500 hover:text-gray-700 text-xl" />
                                    )}
                                </button>
                            </div>


                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
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
                                'Login'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">
                                atau
                            </span>
                        </div>
                    </div>

                    {/* Google Login */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full border border-gray-300 bg-white rounded-lg py-3 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors duration-300 disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                        <FcGoogle className="text-2xl" />
                        <span className="text-gray-700 font-medium">
                            Continue with Google
                        </span>
                    </button>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Belum punya akun?{' '}
                            <Link
                                to="/register"
                                className="text-green-600 hover:text-green-700 font-semibold"
                            >
                                Daftar di sini
                            </Link>
                        </p>
                    </div>

                    {/* Back to Home */}
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

export default Login;