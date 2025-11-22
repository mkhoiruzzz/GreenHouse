import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { isDark, toggleTheme, language, toggleLanguage, t } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-green-600 dark:bg-green-900 text-white fixed w-full top-0 z-50 shadow-lg transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo dan Hamburger Button */}
          <div className="flex items-center space-x-4">
            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex flex-col justify-center items-center w-10 h-10 space-y-1.5 rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition duration-200"
              aria-label="Toggle menu"
            >
              <span className={`block w-6 h-1 bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block w-6 h-1 bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block w-6 h-1 bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 text-2xl font-bold text-yellow-300">
              <span>🌿</span>
              <span>Green House</span>
            </Link>
          </div>

          {/* Right Side Controls - STYLE DIPERBAIKI */}
          <div className="flex items-center space-x-3">
            {/* Language Toggle - STYLE DIPERBAIKI */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition duration-200 border border-green-500 dark:border-green-700"
              title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
            >
              <span className="text-base">{language === 'id' ? '🇮🇩' : '🇬🇧'}</span>
              <span className="font-medium">{language === 'id' ? 'ID' : 'EN'}</span>
            </button>

            {/* Theme Toggle - STYLE DIPERBAIKI */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition duration-200 border border-green-500 dark:border-green-700"
              title={isDark ? t('Mode Terang', 'Light Mode') : t('Mode Gelap', 'Dark Mode')}
            >
              {isDark ? (
                <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                </svg>
              )}
            </button>

            {/* Cart Indicator - STYLE DIPERBAIKI */}
            {isAuthenticated && (
              <Link 
                to="/cart" 
                className="relative p-2 hover:bg-green-700 dark:hover:bg-green-800 rounded-lg transition duration-200 border border-green-500 dark:border-green-700"
              >
                <span className="text-xl">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40" 
            onClick={closeMenu}
          ></div>
        )}

        {/* Sidebar Panel - BAHASA DIPERBAIKI */}
        <div className={`fixed top-0 left-0 h-full w-80 bg-green-600 dark:bg-green-900 shadow-lg transform transition-all duration-300 z-50 overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* HEADER SIDEBAR */}
            <div className="p-4 border-b border-green-500 dark:border-green-700">
              <div className="flex items-center justify-between mb-4">
                <Link 
                  to="/" 
                  className="flex items-center space-x-2 text-2xl font-bold text-yellow-300"
                  onClick={closeMenu}
                >
                  <span>🌿</span>
                  <span>Green House</span>
                </Link>
                <button
                  onClick={closeMenu}
                  className="text-white hover:text-yellow-300 transition duration-200 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* INFO AKUN USER - BAHASA DIPERBAIKI */}
              {isAuthenticated ? (
                <div className="bg-green-700 dark:bg-green-800 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-xl">👤</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-yellow-300 font-semibold text-lg truncate">{user?.username}</div>
                      <div className="text-green-200 text-sm truncate">{user?.email}</div>
                      <div className="text-green-300 text-xs mt-1">
                        {isAdmin ? t('Administrator', 'Administrator') : t('Pelanggan', 'Customer')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-green-200 mb-3">
                    {t('Selamat datang di Green House', 'Welcome to Green House')}
                  </p>
                  <div className="flex space-x-2">
                    <Link
                      to="/login"
                      className="flex-1 bg-yellow-500 text-white py-2 px-3 rounded-lg hover:bg-yellow-600 transition duration-200 text-sm font-semibold"
                      onClick={closeMenu}
                    >
                      {t('Login', 'Login')}
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 bg-white text-green-600 py-2 px-3 rounded-lg hover:bg-gray-100 transition duration-200 text-sm font-semibold"
                      onClick={closeMenu}
                    >
                      {t('Daftar', 'Register')}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* MENU NAVIGASI - BAHASA DIPERBAIKI */}
            <div className="flex-1 p-4 space-y-1">
              <Link
                to="/"
                className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 dark:hover:bg-green-800 rounded-lg transition duration-200"
                onClick={closeMenu}
              >
                <span className="mr-3 text-xl">🏠</span>
                <span className="text-lg">{t('Beranda', 'Home')}</span>
              </Link>
              
              <Link
                to="/products"
                className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 dark:hover:bg-green-800 rounded-lg transition duration-200"
                onClick={closeMenu}
              >
                <span className="mr-3 text-xl">🛍️</span>
                <span className="text-lg">{t('Produk', 'Products')}</span>
              </Link>
              
              <Link
                to="/about"
                className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 dark:hover:bg-green-800 rounded-lg transition duration-200"
                onClick={closeMenu}
              >
                <span className="mr-3 text-xl">ℹ️</span>
                <span className="text-lg">{t('Tentang Kami', 'About Us')}</span>
              </Link>
              
              <Link
                to="/contact"
                className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 dark:hover:bg-green-800 rounded-lg transition duration-200"
                onClick={closeMenu}
              >
                <span className="mr-3 text-xl">📞</span>
                <span className="text-lg">{t('Kontak', 'Contact')}</span>
              </Link>

              <div className="border-t border-green-500 dark:border-green-700 my-3"></div>

              {isAuthenticated && (
                <>
                  <Link
                    to="/cart"
                    className="flex items-center justify-between py-3 px-4 hover:text-yellow-300 hover:bg-green-700 dark:hover:bg-green-800 rounded-lg transition duration-200"
                    onClick={closeMenu}
                  >
                    <div className="flex items-center">
                      <span className="mr-3 text-xl">🛒</span>
                      <span className="text-lg">{t('Keranjang', 'Cart')}</span>
                    </div>
                    {cartCount > 0 && (
                      <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  
                  <Link
                    to="/orders"
                    className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 dark:hover:bg-green-800 rounded-lg transition duration-200"
                    onClick={closeMenu}
                  >
                    <span className="mr-3 text-xl">📦</span>
                    <span className="text-lg">{t('Pesanan Saya', 'My Orders')}</span>
                  </Link>
                  
                  <Link
                    to="/profile"
                    className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 dark:hover:bg-green-800 rounded-lg transition duration-200"
                    onClick={closeMenu}
                  >
                    <span className="mr-3 text-xl">👤</span>
                    <span className="text-lg">{t('Profil Saya', 'My Profile')}</span>
                  </Link>
                  
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 dark:hover:bg-green-800 rounded-lg transition duration-200"
                      onClick={closeMenu}
                    >
                      <span className="mr-3 text-xl">⚙️</span>
                      <span className="text-lg">{t('Admin Dashboard', 'Admin Dashboard')}</span>
                    </Link>
                  )}

                  <div className="border-t border-green-500 dark:border-green-700 my-3"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left py-3 px-4 hover:text-yellow-300 hover:bg-green-700 dark:hover:bg-green-800 rounded-lg transition duration-200"
                  >
                    <span className="mr-3 text-xl">🚪</span>
                    <span className="text-lg">{t('Logout', 'Logout')}</span>
                  </button>
                </>
              )}
            </div>

            {/* FOOTER SIDEBAR - BAHASA DIPERBAIKI */}
            <div className="p-4 border-t border-green-500 dark:border-green-700">
              <div className="text-center text-green-200 text-sm">
                <p>🌿 Green House</p>
                <p className="text-xs mt-1">
                  {t('Toko Tanaman Hias Terlengkap', 'Complete Ornamental Plant Store')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;