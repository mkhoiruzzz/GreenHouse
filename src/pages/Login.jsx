// src/pages/Login.jsx - With Dark Mode & Language Support
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const { t } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error(t('Email dan password wajib diisi', 'Email and password are required'));
      return;
    }

    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        setFormData({ email: '', password: '' });
      } else {
        toast.error(result.message || t('Login gagal', 'Login failed'));
      }
    } catch (error) {
      console.error('Login component error:', error);
      toast.error(t('Terjadi kesalahan sistem', 'System error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (error) {
      toast.error(t('Gagal login dengan Google', 'Failed to login with Google'));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fungsi untuk toggle show/hide password
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen mt-16 py-12 bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2 transition-colors duration-300">
              {t('Login', 'Login')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              {t('Masuk ke akun Green House Anda', 'Sign in to your Green House account')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                {t('Email', 'Email')} *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500 focus:border-transparent disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                placeholder={t('masukkan email Anda', 'enter your email')}
              />
            </div>

            <div className="relative"> {/* ✅ Wrapper relative untuk icon */}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                {t('Password', 'Password')} *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} // ✅ Toggle type
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500 focus:border-transparent disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 pr-12" // ✅ pr-12 untuk memberi ruang icon
                  placeholder={t('masukkan password', 'enter password')}
                  minLength="6"
                />
                {/* ✅ Icon mata untuk toggle password visibility */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 focus:outline-none disabled:opacity-50"
                  aria-label={showPassword ? t('Sembunyikan password', 'Hide password') : t('Tampilkan password', 'Show password')}
                >
                  {showPassword ? (
                    <FaEyeSlash className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xl transition-colors duration-300" />
                  ) : (
                    <FaEye className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xl transition-colors duration-300" />
                  )}
                </button>
              </div>
              {/* ✅ Link forgot password */}
              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors duration-300"
                >
                  {t('Lupa password?', 'Forgot password?')}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 dark:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('Memproses...', 'Processing...')}
                </span>
              ) : (
                t('Login', 'Login')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600 transition-colors duration-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400 transition-colors duration-300">
                {t('atau', 'or')}
              </span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg py-3 flex items-center justify-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-300 disabled:opacity-50 shadow-sm hover:shadow-md"
          >
            <FcGoogle className="text-2xl" />
            <span className="text-gray-700 dark:text-gray-200 font-medium transition-colors duration-300">
              {t('Continue with Google', 'Continue with Google')}
            </span>
          </button>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              {t('Belum punya akun?', "Don't have an account?")}{' '}
              <Link
                to="/register"
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold transition-colors duration-300"
              >
                {t('Daftar di sini', 'Register here')}
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="text-center">
              <Link
                to="/"
                className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 text-sm transition-colors duration-300"
              >
                ← {t('Kembali ke Beranda', 'Back to Home')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;