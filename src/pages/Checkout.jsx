// src/pages/Product.jsx - MODERN E-COMMERCE LAYOUT WITH DARK MODE (RESTYLED HEADER)
import { useState, useEffect, useRef } from 'react';
import { productsService } from '../services/productsService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';

const Product = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    durability: '',
    sort: 'newest',
    productType: 'all',
    priceRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [expandedSections, setExpandedSections] = useState({
    productType: true,
    categories: true,
    durability: true,
    price: true
  });

  const { cartItems } = useCart();
  const prevCartCountRef = useRef(0);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  useEffect(() => {
    console.log('🔄 Product component mounted');
    fetchCategories();
    fetchProducts();
    prevCartCountRef.current = cartItems.length;
  }, []);

  useEffect(() => {
    console.log('🔄 Filters changed:', filters);
    fetchProducts();
  }, [filters]);

  useEffect(() => {
    if (cartItems.length > prevCartCountRef.current) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    prevCartCountRef.current = cartItems.length;
  }, [cartItems]);

  const fetchCategories = async () => {
    try {
      console.log('🔄 Starting to fetch categories...');
      const categoriesData = await productsService.getAllCategories();
      console.log('✅ Categories fetched:', categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      toast.error('Gagal memuat kategori');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting to fetch products with filters:', filters);
      
      let allProducts = await productsService.getAllProducts();
      let filteredProducts = allProducts;
      
      if (filters.search) {
        filteredProducts = filteredProducts.filter(product =>
          product.nama_produk.toLowerCase().includes(filters.search.toLowerCase()) ||
          product.deskripsi.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      if (filters.category) {
        filteredProducts = filteredProducts.filter(product =>
          product.kategori_id == filters.category
        );
      }
      
      if (filters.durability) {
        filteredProducts = filteredProducts.filter(product =>
          product.durability === filters.durability
        );
      }
      
      if (filters.productType === 'plants') {
        filteredProducts = filteredProducts.filter(product => {
          const categoryName = product.categories?.name_kategori || '';
          return !categoryName.toLowerCase().includes('benih') &&
                 !categoryName.toLowerCase().includes('pupuk') &&
                 !categoryName.toLowerCase().includes('pot') &&
                 !categoryName.toLowerCase().includes('bibit');
        });
      } 
      else if (filters.productType === 'accessories') {
        filteredProducts = filteredProducts.filter(product => {
          const categoryName = product.categories?.name_kategori || '';
          return categoryName.toLowerCase().includes('benih') ||
                 categoryName.toLowerCase().includes('pupuk') ||
                 categoryName.toLowerCase().includes('pot') ||
                 categoryName.toLowerCase().includes('bibit');
        });
      }
      
      if (filters.sort === 'newest') {
        filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (filters.sort === 'price_low') {
        filteredProducts.sort((a, b) => a.harga - b.harga);
      } else if (filters.sort === 'price_high') {
        filteredProducts.sort((a, b) => b.harga - a.harga);
      } else if (filters.sort === 'name') {
        filteredProducts.sort((a, b) => a.nama_produk.localeCompare(b.nama_produk));
      }
      
      console.log('✅ Final filtered products:', filteredProducts);
      setProducts(filteredProducts);
      
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      toast.error('Gagal memuat produk');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      search: '',
      durability: '',
      sort: 'newest',
      productType: 'all',
      priceRange: 'all'
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== 'all' && value !== 'newest'
  ).length;

  const quickFilters = [
    { value: 'plants', label: '🌿 Tanaman Hias', type: 'productType' },
    { value: 'accessories', label: '🛢️ Aksesoris', type: 'productType' },
    { value: 'easy', label: '🌱 Mudah Rawat', type: 'durability' },
  ];

  const handleQuickFilter = (filter) => {
    if (filters[filter.type] === filter.value) {
      handleFilterChange(filter.type, filter.type === 'productType' ? 'all' : '');
    } else {
      handleFilterChange(filter.type, filter.value);
    }
  };

  const isQuickFilterActive = (filter) => {
    return filters[filter.type] === filter.value;
  };

  const ProductCardSkeleton = ({ viewMode }) => {
    if (viewMode === 'list') {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse transition-colors duration-300">
          <div className="flex gap-4">
            <div className="w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-3 w-3/4"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-1/2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-2/3"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse transition-colors duration-300">
        <div className="w-full h-48 bg-gray-300 dark:bg-gray-600"></div>
        <div className="p-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-2/3"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen mt-16 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ====== NEW STYLED HEADER (gradient, capsule quick filters) ====== */}
        <div className="rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white p-6 md:p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl drop-shadow">
                    🌿
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Selamat datang di</div>
                    <div className="text-2xl md:text-3xl font-extrabold leading-tight">Green House</div>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-6 ml-6">
                  <div className="text-center">
                    <div className="text-xl font-bold">{products.length}</div>
                    <div className="text-xs opacity-90">Produk</div>
                  </div>
                  <div className="h-8 w-px bg-white/30" />
                  <div className="text-center">
                    <div className="text-xl font-bold">{categories.length}</div>
                    <div className="text-xs opacity-90">Kategori</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                {/* Search input */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Cari produk atau deskripsi..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm font-medium bg-white/20 placeholder-white/80 focus:bg-white/30 focus:outline-none transition-all"
                  />
                </div>

                {/* Quick Filter Chips */}
                <div className="flex flex-wrap gap-2 items-center justify-end">
                  {quickFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => handleQuickFilter(filter)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                        isQuickFilterActive(filter)
                          ? 'bg-white text-emerald-700 shadow-md scale-105'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* View Mode + Sort (mobile compact) */}
                <div className="flex items-center gap-2 md:ml-3">
                  <div className="flex bg-white/20 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white text-emerald-600' : 'text-white/80'}`}
                      aria-label="Grid view"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white text-emerald-600' : 'text-white/80'}`}
                      aria-label="List view"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="relative">
                    <select
                      value={filters.sort}
                      onChange={(e) => handleFilterChange('sort', e.target.value)}
                      className="appearance-none rounded-xl px-3 py-2 pr-8 text-sm font-semibold bg-white text-emerald-700 shadow-sm"
                    >
                      <option value="newest">📅 Terbaru</option>
                      <option value="name">📤 Nama A-Z</option>
                      <option value="price_low">💰 Harga: Rendah → Tinggi</option>
                      <option value="price_high">💎 Harga: Tinggi → Rendah</option>
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-700 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* subtle white card below gradient for mobile spacing */}
          <div className="bg-white dark:bg-gray-800 border-t border-white/10 dark:border-gray-700 p-3 md:p-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <div>Menampilkan <span className="font-semibold text-emerald-600">{products.length}</span> produk</div>
              <div className="hidden md:flex items-center gap-2">
                <button onClick={clearFilters} className="text-sm text-emerald-600 hover:underline">Reset Filter</button>
              </div>
            </div>
          </div>
        </div>

        {/* ====== Content below header (sidebar + product grid) ====== */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Sidebar Filters */}
          <div className={`lg:w-80 ${showFilters ? 'fixed inset-0 z-50 bg-white dark:bg-gray-800 p-6 overflow-y-auto transition-colors duration-300' : 'hidden lg:block'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-24 transition-colors duration-300">
              {/* Filter Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Filter Produk</h3>
                </div>
                <div className="flex items-center gap-3">
                  {activeFiltersCount > 0 && (
                    <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold transition-colors duration-300"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-300"
                    aria-label="Close filters"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 transition-colors duration-300">🔍 Cari Produk</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari produk atau deskripsi..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full p-4 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                    aria-label="Search products"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Collapsible Sections */}
              <div className="space-y-4">
                {/* Product Type */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-colors duration-300">
                  <button
                    onClick={() => toggleSection('productType')}
                    className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300"
                  >
                    <span className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">🎯 Jenis Produk</span>
                    <svg 
                      className={`w-4 h-4 transform transition-transform ${expandedSections.productType ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.productType && (
                    <div className="p-4 space-y-3 bg-white dark:bg-gray-800 transition-colors duration-300">
                      {[
                        { value: 'all', label: '🌿 Semua Produk', emoji: '' },
                        { value: 'plants', label: '🌱 Tanaman', emoji: '' },
                        { value: 'accessories', label: '🛢️ Benih Dan Pupuk', emoji: '' }
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => handleFilterChange('productType', type.value)}
                          className={`w-full text-left p-3 rounded-lg font-medium transition-all flex items-center gap-3 ${
                            filters.productType === type.value 
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-700 shadow-sm' 
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent transition-colors duration-300'
                          }`}
                        >
                          <span className="text-xl">{type.emoji}</span>
                          <span className="font-semibold">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Categories */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-colors duration-300">
                  <button
                    onClick={() => toggleSection('categories')}
                    className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300"
                  >
                    <span className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">📁 Kategori</span>
                    <svg 
                      className={`w-4 h-4 transform transition-transform ${expandedSections.categories ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.categories && (
                    <div className="p-4 bg-white dark:bg-gray-800 transition-colors duration-300">
                      <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-colors duration-300"
                        aria-label="Filter by category"
                      >
                        <option value="">🔍 Semua Kategori</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name_kategori || category.nama_kategori || category.title || category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Durability */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-colors duration-300">
                  <button
                    onClick={() => toggleSection('durability')}
                    className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300"
                  >
                    <span className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">💪 Tingkat Perawatan</span>
                    <svg 
                      className={`w-4 h-4 transform transition-transform ${expandedSections.durability ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.durability && (
                    <div className="p-4 bg-white dark:bg-gray-800 transition-colors duration-300">
                      <select
                        value={filters.durability}
                        onChange={(e) => handleFilterChange('durability', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-colors duration-300"
                        aria-label="Filter by maintenance level"
                      >
                        <option value="">🌟 Semua Tingkat</option>
                        <option value="easy">🌱 Mudah</option>
                        <option value="medium">💪 Sedang</option>
                        <option value="hard">🔥 Sulit</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Enhanced Mobile Filter Trigger */}
            <div className="lg:hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 mb-6 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  aria-label="Open filters"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  Filter Produk
                  {activeFiltersCount > 0 && (
                    <span className="bg-white text-emerald-500 text-xs px-2 py-1 rounded-full font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium transition-colors duration-300">
                  Menampilkan <span className="font-bold text-emerald-600 dark:text-emerald-400 transition-colors duration-300">{products.length}</span> produk
                </div>
              </div>
            </div>

            {/* Products Grid/List dengan Skeleton */}
            {loading ? (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-6"
              }>
                {[...Array(8)].map((_, i) => (
                  <ProductCardSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-6"
              }>
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <div className="text-8xl mb-6">🌱</div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 transition-colors duration-300">
                  Produk Tidak Ditemukan
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto text-lg transition-colors duration-300">
                  Maaf, tidak ada produk yang sesuai dengan filter yang Anda pilih. Coba ubah filter atau kata kunci pencarian.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={clearFilters}
                    className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    🔄 Tampilkan Semua Produk
                  </button>
                  <button
                    onClick={() => setShowFilters(true)}
                    className="border-2 border-emerald-500 dark:border-emerald-400 text-emerald-500 dark:text-emerald-400 px-8 py-4 rounded-xl font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-200 transition-colors"
                  >
                    🔍 Ubah Pencarian
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile filters */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setShowFilters(false)}
        />
      )}
    </div>  
  );
};

export default Product;
