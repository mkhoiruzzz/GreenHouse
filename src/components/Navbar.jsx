import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import NotificationBell from './NotificationBell';
import {
  FiHome,
  FiGrid,
  FiInfo,
  FiMail,
  FiShoppingCart,
  FiUser,
  FiPackage,
  FiLogOut,
  FiShield,
  FiMenu,
  FiX,
  FiSearch
} from 'react-icons/fi';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const { user, profile, logout, isAuthenticated, isAdmin } = useAuth();
  const { cartCount, toggleCartDrawer } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCart, setShowCart] = useState(true);

  // Update cart visibility based on current path or user role
  useEffect(() => {
    if (location.pathname.startsWith('/admin') || isAdmin) {
      setShowCart(false);
    } else {
      setShowCart(true);
    }
  }, [location.pathname, isAdmin]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }

      const isOutsideDesktop = !searchRef.current || !searchRef.current.contains(event.target);
      const isOutsideMobile = !mobileSearchRef.current || !mobileSearchRef.current.contains(event.target);

      if (isOutsideDesktop && isOutsideMobile) {
        setShowSearchDropdown(false);
        // Do not close the mobile search overlay entirely, just the dropdown results
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      return;
    }

    // Show dropdown immediately with loading state
    setShowSearchDropdown(true);
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            nama_produk,
            harga,
            gambar_url,
            categories:categories(name_kategori)
          `)
          .ilike('nama_produk', `%${searchQuery.trim()}%`)
          .limit(6);

        if (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } else {
          setSearchResults(data || []);
        }
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Sync search input with URL search parameter
  useEffect(() => {
    const searchParam = new URLSearchParams(location.search).get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    } else if (location.pathname !== '/products') {
      // Clear search if navigating away from products and no search param exists
      setSearchQuery('');
    }
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      logout();
      setIsOpen(false);
      setIsProfileOpen(false);
      navigate('/');
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    setIsProfileOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSearchDropdown(false);
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleResultClick = (productId) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/product/${productId}`);
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className={`relative px-3 py-2 rounded-md font-medium transition-all duration-300 group ${isActive(to) ? 'text-yellow-300' : 'text-white hover:text-yellow-200'
        }`}
    >
      <span>{children}</span>
      <span className={`absolute bottom-1 left-3 right-3 h-0.5 bg-yellow-300 transform transition-transform duration-300 origin-left ${isActive(to) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        }`}></span>
    </Link>
  );

  return (
    <nav className="bg-green-600 text-white sticky top-0 w-full z-[100] border-b border-white/10 shadow-lg transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo dan Hamburger Button */}
          <div className="flex items-center space-x-4">
            {/* Hamburger Button */}
            <button
              onClick={() => {
                setIsOpen(!isOpen);
                if (!isOpen) {
                  setIsMobileSearchOpen(false); // Close search if opening sidebar
                }
              }}
              className={`md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-white/10 transition duration-200 relative z-[101] ${isOpen ? 'invisible' : ''}`}
              aria-label="Toggle menu"
            >
              <FiMenu className="text-2xl" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 text-xl md:text-2xl font-bold text-yellow-300 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">🌱</span>
              <span className="hidden sm:block tracking-tight">Green House</span>
              <span className="sm:hidden text-base">Green House</span>
            </Link>
          </div>

          {/* Navigation Links - Desktop Only */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <NavLink to="/">Beranda</NavLink>
            <NavLink to="/products">Produk</NavLink>
            <NavLink to="/about">Tentang Kami</NavLink>
            <NavLink to="/contact">Kontak</NavLink>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Search Bar with Autocomplete */}
            <div ref={searchRef} className="hidden lg:block relative">
              <form onSubmit={handleSearch} className="relative group">
                <input
                  type="text"
                  placeholder="Cari tanaman..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                  className="bg-white/10 text-white text-sm rounded-full py-1.5 pl-4 pr-10 w-32 focus:w-64 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-yellow-300/50 placeholder-green-100/50 backdrop-blur-sm border border-white/10"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-green-100/70 group-focus-within:text-yellow-300 transition-colors">
                  {isSearching
                    ? <span className="w-4 h-4 border-2 border-yellow-300/50 border-t-yellow-300 rounded-full animate-spin inline-block" />
                    : <FiSearch />}
                </button>
              </form>

              {/* Search Dropdown — tampil saat mengetik */}
              {(showSearchDropdown || isSearching) && searchQuery.trim().length >= 1 && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" style={{ zIndex: 9999 }}>

                  {/* Loading state */}
                  {isSearching && (
                    <div className="px-4 py-6 flex items-center justify-center gap-2 text-gray-400">
                      <span className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                      <span className="text-sm">Mencari produk...</span>
                    </div>
                  )}

                  {/* Results */}
                  {!isSearching && searchResults.length > 0 && (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400 font-medium">Hasil Pencarian</p>
                        <p className="text-xs text-green-600 font-semibold">{searchResults.length} produk</p>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleResultClick(product.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors duration-150 text-left group"
                          >
                            {/* Product Image */}
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                              <img
                                src={product.gambar_url}
                                alt={product.nama_produk}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://placehold.co/48x48/4ade80/ffffff?text=No+Img';
                                }}
                              />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-green-700">
                                {product.nama_produk}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {product.categories?.name_kategori || 'Tanaman'}
                              </p>
                              <p className="text-xs font-bold text-green-600 mt-0.5">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.harga)}
                              </p>
                            </div>

                            <span className="text-gray-300 group-hover:text-green-500 transition-colors text-lg flex-shrink-0">›</span>
                          </button>
                        ))}
                      </div>

                      {/* See All */}
                      <button
                        onClick={() => { setShowSearchDropdown(false); navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`); }}
                        className="w-full px-4 py-3 text-sm text-center text-green-600 font-semibold hover:bg-green-50 border-t border-gray-100 transition-colors"
                      >
                        Lihat semua hasil untuk &ldquo;{searchQuery}&rdquo;
                      </button>
                    </>
                  )}

                  {/* No results */}
                  {!isSearching && searchResults.length === 0 && showSearchDropdown && (
                    <div className="px-4 py-6 text-center">
                      <p className="text-2xl mb-1">🌱</p>
                      <p className="text-sm text-gray-500">Produk tidak ditemukan</p>
                      <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            {isAuthenticated && <NotificationBell />}

            {/* Mobile Search Toggle Icon */}
            <div className="lg:hidden" ref={mobileSearchRef}>
              <button
                onClick={() => {
                  setIsMobileSearchOpen(!isMobileSearchOpen);
                  if (!isMobileSearchOpen) {
                    setIsOpen(false); // Close sidebar if opening search
                  }
                }}
                className="p-2 text-white hover:text-yellow-300 transition-colors rounded-full"
                aria-label="Toggle mobile search"
              >
                {isMobileSearchOpen ? <FiX className="text-xl" /> : <FiSearch className="text-xl" />}
              </button>

              {/* Mobile Search Popup Overlay */}
              {isMobileSearchOpen && (
                <div className="absolute top-16 left-0 w-full bg-green-600 shadow-xl border-t border-white/10 p-4 z-[105]">
                  <form onSubmit={(e) => { handleSearch(e); setIsMobileSearchOpen(false); }} className="relative">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Cari tanaman..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                      className="w-full bg-white/10 text-white text-sm rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-yellow-300/50 placeholder-green-100/50 backdrop-blur-sm border border-white/20"
                    />
                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white p-2">
                      {isSearching
                        ? <span className="w-5 h-5 border-2 border-yellow-300/50 border-t-yellow-300 rounded-full animate-spin inline-block" />
                        : <FiSearch className="text-lg" />}
                    </button>
                  </form>

                  {/* Mobile Search Dropdown in Popup */}
                  {(showSearchDropdown || isSearching) && searchQuery.trim().length >= 1 && (
                    <div className="mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-[calc(100vh-140px)] flex flex-col">

                      {/* Loading */}
                      {isSearching && (
                        <div className="px-4 py-6 flex items-center justify-center gap-2 text-gray-400">
                          <span className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                          <span className="text-sm">Mencari...</span>
                        </div>
                      )}

                      {/* Results */}
                      {!isSearching && searchResults.length > 0 && (
                        <>
                          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                            <p className="text-xs text-gray-400 font-medium">Hasil Pencarian</p>
                            <p className="text-xs text-green-600 font-semibold">{searchResults.length} produk</p>
                          </div>

                          <div className="overflow-y-auto divide-y divide-gray-50 flex-1">
                            {searchResults.map((product) => (
                              <button
                                key={product.id}
                                onClick={() => { handleResultClick(product.id); setIsMobileSearchOpen(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-green-50 transition-colors text-left group"
                              >
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                  <img
                                    src={product.gambar_url}
                                    alt={product.nama_produk}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/48x48/4ade80/ffffff?text=No+Img'; }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-green-700">{product.nama_produk}</p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {product.categories?.name_kategori || 'Tanaman'}
                                  </p>
                                  <p className="text-xs font-bold text-green-600 mt-0.5">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.harga)}
                                  </p>
                                </div>
                                <span className="text-gray-300 group-hover:text-green-500 transition-colors text-lg flex-shrink-0">›</span>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => { setShowSearchDropdown(false); navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`); setIsMobileSearchOpen(false); }}
                            className="w-full px-4 py-3 text-sm text-center text-green-600 font-semibold hover:bg-green-50 border-t border-gray-100 transition-colors flex-shrink-0"
                          >
                            Lihat semua hasil untuk &ldquo;{searchQuery}&rdquo;
                          </button>
                        </>
                      )}

                      {/* No results */}
                      {!isSearching && searchResults.length === 0 && showSearchDropdown && (
                        <div className="px-4 py-8 text-center flex-shrink-0">
                          <p className="text-3xl mb-2">🌱</p>
                          <p className="text-sm text-gray-500">Produk tidak ditemukan</p>
                          <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>



            {/* Profile Dropdown or Login Button */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-green-700 transition duration-200 border border-green-500"
                >
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center overflow-hidden border border-yellow-300">
                    {(profile?.avatar_url || user?.user_metadata?.avatar_url) ? (
                      <img
                        src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiUser className="text-xl" />
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-sm text-green-600 font-bold truncate">
                        {user?.email}
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition duration-150"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FiUser className="text-lg" />
                      <span>Profile Saya</span>
                    </Link>

                    {!isAdmin && (
                      <>
                        <button
                          onClick={() => { toggleCartDrawer(true); setIsProfileOpen(false); }}
                          className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition duration-150"
                        >
                          <span className="relative">
                            <FiShoppingCart className="text-lg" />
                            {cartCount > 0 && (
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                                {cartCount}
                              </span>
                            )}
                          </span>
                          <span>Keranjang Saya</span>
                        </button>

                        <Link
                          to="/orders"
                          className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition duration-150"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiPackage className="text-lg" />
                          <span>Pesanan Saya</span>
                        </Link>
                      </>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition duration-150"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <FiShield className="text-lg" />
                        <span>Panel Admin</span>
                      </Link>
                    )}

                    <div className="border-t border-gray-50 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition duration-150"
                    >
                      <FiLogOut className="text-lg" />
                      <span>Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 bg-yellow-400 text-green-800 px-3 py-1.5 md:px-4 rounded-full font-bold hover:bg-yellow-300 transition duration-200 shadow-sm text-sm"
              >
                <FiUser className="text-lg" />
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[90]"
            onClick={closeMenu}
          ></div>
        )}

        {/* Sidebar Panel */}
        <div className={`fixed top-0 left-0 h-full w-80 bg-green-600 shadow-2xl transform transition-all duration-500 z-[95] overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-white/10`}>
          <div className="flex flex-col h-full">
            {/* HEADER SIDEBAR */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-8">
                <Link
                  to="/"
                  className="flex items-center space-x-2 text-2xl font-bold text-yellow-300 group"
                  onClick={closeMenu}
                >
                  <span className="group-hover:rotate-12 transition-transform duration-300">🌱</span>
                  <span className="tracking-tight">Green House</span>
                </Link>
                <button
                  onClick={closeMenu}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition duration-200"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              {/* INFO AKUN USER */}
              {isAuthenticated ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-inner">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center overflow-hidden border-2 border-yellow-300/50 shadow-lg">
                      {(profile?.avatar_url || user?.user_metadata?.avatar_url) ? (
                        <img
                          src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiUser className="text-3xl" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-yellow-300 font-bold text-lg truncate">
                        {user?.email}
                      </div>
                      <div className="inline-block px-2 py-0.5 mt-2 bg-yellow-400/20 text-yellow-300 text-[10px] font-bold uppercase tracking-widest rounded-full border border-yellow-300/20">
                        {isAdmin ? 'Administrator' : 'Pelanggan'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-green-200 mb-3">
                    Selamat datang di Green House
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
                className="flex items-center space-x-3 py-3 px-4 hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200"
                onClick={closeMenu}
              >

                <span className="text-lg">Beranda</span>
              </Link>

              <Link
                to="/products"
                className="flex items-center space-x-3 py-3 px-4 hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200"
                onClick={closeMenu}
              >

                <span className="text-lg">Produk</span>
              </Link>

              <Link
                to="/about"
                className="flex items-center space-x-3 py-3 px-4 hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200"
                onClick={closeMenu}
              >

                <span className="text-lg">Tentang Kami</span>
              </Link>

              <Link
                to="/contact"
                className="flex items-center space-x-3 py-3 px-4 hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200"
                onClick={closeMenu}
              >

                <span className="text-lg">Kontak</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center space-x-3 py-3 px-4 md:hidden hover:text-yellow-300 hover:bg-green-700 rounded-lg transition duration-200"
                  onClick={closeMenu}
                >
                  <FiShield className="text-xl" />
                  <span className="text-lg font-semibold text-yellow-300">Panel Admin</span>
                </Link>
              )}
            </div>

            {/* FOOTER SIDEBAR */}
            <div className="p-4 border-t border-green-500">
              <div className="text-center text-green-200 text-sm">
                <p>🌿 Green House</p>
                <p className="text-xs mt-1">
                  Green House Hias Terlengkap
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
