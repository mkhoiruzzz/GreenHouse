import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, logout, isAuthenticated, isAdmin } = useAuth();
  const { cartCount, toggleCartDrawer } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      logout();
      setIsOpen(false);
      navigate('/');
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-green-600 text-white fixed w-full top-0 z-50 shadow-lg transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo dan Hamburger Button */}
          <div className="flex items-center space-x-4">
            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex flex-col justify-center items-center w-10 h-10 space-y-1.5 rounded-lg hover:bg-green-700 transition duration-200"
              aria-label="Toggle menu"
            >
              <span className={`block w-6 h-1 bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block w-6 h-1 bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block w-6 h-1 bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-1 md:space-x-2 text-xl md:text-2xl font-bold text-yellow-300">
              <span className="text-lg md:text-xl">🌿</span>
              {/* Desktop: Full text, Mobile: Short text */}
              <span className="hidden sm:block">Toko Tanaman</span>
              <span className="sm:hidden text-base">Toko Tanaman</span>
            </Link>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-1 md:space-x-3">
            {/* Notification Bell */}
            {isAuthenticated && <NotificationBell />}

            {/* Cart Indicator */}
            {isAuthenticated && (
              <button
                onClick={() => toggleCartDrawer(true)}
                className="relative hover:text-yellow-300 transition duration-200 p-2"
                aria-label="Keranjang Belanja"
              >
                <span className="text-xl">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
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

        {/* Sidebar Panel */}
        <div className={`fixed top-0 left-0 h-full w-80 bg-green-600 shadow-lg transform transition-all duration-300 z-50 overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* HEADER SIDEBAR */}
            <div className="p-4 border-b border-green-500">
              <div className="flex items-center justify-between mb-4">
                <Link
                  to="/"
                  className="flex items-center space-x-2 text-2xl font-bold text-yellow-300"
                  onClick={closeMenu}
                >
                  <span>🌿</span>
                  <span>Toko Tanaman</span>
                </Link>
                <button
                  onClick={closeMenu}
                  className="text-white hover:text-yellow-300 transition duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* INFO AKUN USER */}
              {isAuthenticated ? (
                <div className="bg-green-700 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center overflow-hidden border-2 border-yellow-300">
                      {(profile?.avatar_url || user?.user_metadata?.avatar_url) ? (
                        <img
                          src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-yellow-300 font-semibold text-lg truncate">
                        {profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0]}
                      </div>
                      <div className="text-green-200 text-sm truncate">{user?.email}</div>
                      <div className="text-green-300 text-xs mt-1">
                        {isAdmin ? 'Administrator' : 'Pelanggan'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-green-200 mb-3">
                    Selamat datang di Toko Tanaman
                  </p>
                  <div className="flex space-x-2">
                    <Link
                      to="/login"
                      className="flex-1 bg-yellow-500 text-white py-2 px-3 rounded-lg hover:bg-yellow-600 transition duration-200 text-sm font-semibold"
                      onClick={closeMenu}
                    >
                      Masuk
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 bg-white text-green-600 py-2 px-3 rounded-lg hover:bg-gray-100 transition duration-200 text-sm font-semibold"
                      onClick={closeMenu}
                    >
                      Daftar
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* MENU NAVIGASI */}
            <div className="flex-1 p-4 space-y-2">
              <Link
                to="/"
                className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200"
                onClick={closeMenu}
              >
                <span className="text-lg">Beranda</span>
              </Link>


              <Link
                to="/products"
                className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200"
                onClick={closeMenu}
              >

                <span className="text-lg">Produk</span>
              </Link>

              <Link
                to="/about"
                className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200"
                onClick={closeMenu}
              >

                <span className="text-lg">Tentang Kami</span>
              </Link>

              <Link
                to="/contact"
                className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200"
                onClick={closeMenu}
              >

                <span className="text-lg">Kontak</span>
              </Link>

              <div className="border-t border-green-500 my-4"></div>

              {isAuthenticated && (
                <>
                  <button
                    onClick={() => {
                      closeMenu();
                      toggleCartDrawer(true);
                    }}
                    className="flex justify-between items-center w-full py-3 px-4 hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200 text-left"
                  >
                    <span className="text-lg">Keranjang</span>
                    {cartCount > 0 && (
                      <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        {cartCount}
                      </span>
                    )}
                  </button>

                  <Link
                    to="/orders"
                    className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200"
                    onClick={closeMenu}
                  >

                    <span className="text-lg">Pesanan Saya</span>
                  </Link>

                  <Link
                    to="/profile"
                    className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200"
                    onClick={closeMenu}
                  >

                    <span className="text-lg">Profil Saya</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center py-3 px-4 hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200"
                      onClick={closeMenu}
                    >

                      <span className="text-lg">Panel Admin</span>
                    </Link>
                  )}

                  <div className="border-t border-green-500 my-4"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left py-3 px-4 hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200"
                  >

                    <span className="text-lg">Keluar</span>
                  </button>
                </>
              )}
            </div>

            {/* FOOTER SIDEBAR */}
            <div className="p-4 border-t border-green-500">
              <div className="text-center text-green-200 text-sm">
                <p>🌿 Toko Tanaman</p>
                <p className="text-xs mt-1">
                  Toko Tanaman Hias Terlengkap
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