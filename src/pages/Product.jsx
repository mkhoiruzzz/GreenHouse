// src/pages/Product.jsx - TOKOPEDIA STYLE REDESIGN
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsService } from '../services/productsService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

const Product = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const categoryConvertedRef = useRef(false);
  const hasInitialFetchRef = useRef(false);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // ✅ Baca URL parameters saat component mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    console.log('🔄 Product component mounted');
    console.log('📋 URL params - category:', categoryParam, 'search:', searchParam);
    
    // Reset refs
    categoryConvertedRef.current = false;
    hasInitialFetchRef.current = false;
    
    // Set initial filters dari URL
    const initialFilters = {
      category: categoryParam || '',
      search: searchParam || '',
      durability: '',
      sort: 'newest',
      productType: 'all',
      priceRange: 'all'
    };
    setFilters(initialFilters);
    
    fetchCategories();
    prevCartCountRef.current = cartItems.length;
  }, []);

  // ✅ Konversi category name ke ID setelah categories loaded (hanya sekali)
  useEffect(() => {
    if (categories.length > 0 && filters.category && isNaN(Number(filters.category)) && !categoryConvertedRef.current) {
      // Jika category adalah string (nama kategori), cari ID-nya
      const foundCategory = categories.find(cat => 
        cat.name_kategori?.toLowerCase() === filters.category?.toLowerCase() ||
        cat.nama_kategori?.toLowerCase() === filters.category?.toLowerCase()
      );
      
      if (foundCategory) {
        console.log('✅ Found category ID for:', filters.category, '->', foundCategory.id);
        setFilters(prev => ({ ...prev, category: String(foundCategory.id) }));
        categoryConvertedRef.current = true;
      } else {
        console.warn('⚠️ Category not found:', filters.category);
        setFilters(prev => ({ ...prev, category: '' }));
        categoryConvertedRef.current = true;
      }
    }
  }, [categories, filters.category]);

  // ✅ Fetch products saat filters berubah, tapi hindari infinite loop
  useEffect(() => {
    // Skip jika masih menunggu categories untuk konversi category name
    if (filters.category && isNaN(Number(filters.category)) && categories.length === 0) {
      console.log('⏳ Waiting for categories to convert category name...');
      return;
    }
    
    console.log('🔄 Filters changed, fetching products:', filters);
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
      
      let allProducts = [];
      try {
        allProducts = await productsService.getAllProducts();
        console.log('✅ Products fetched successfully:', allProducts?.length || 0, 'products');
        console.log('📦 First product:', allProducts[0]);
      } catch (fetchError) {
        console.error('❌ Error fetching products from service:', fetchError);
        throw fetchError;
      }
      
      if (!Array.isArray(allProducts)) {
        console.warn('⚠️ Products is not an array:', allProducts);
        allProducts = [];
      }
      
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
      
      console.log('✅ Final filtered products:', filteredProducts?.length || 0);
      setProducts(filteredProducts || []);
      
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      toast.error('Gagal memuat produk. Silakan refresh halaman.');
      setProducts([]);
    } finally {
      // ✅ PASTIKAN loading selalu di-set ke false
      console.log('✅ Setting loading to false');
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

  const ProductCardSkeleton = ({ viewMode }) => {
    if (viewMode === 'list') {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-32 h-32 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
              <div className="h-6 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
        <div className="w-full h-48 bg-gray-200"></div>
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-3"></div>
          <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
          <div className="h-6 bg-gray-200 rounded w-20 mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
     <div className="min-h-screen mt-16 bg-gradient-to-br from-green-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Modern Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 text-white py-8 sm:py-12 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">
              🌱 Green House
            </h1>
            <p className="text-green-100 text-sm sm:text-base max-w-2xl mx-auto">
              Temukan tanaman hias dan aksesoris berkualitas untuk menghiasi rumah Anda
            </p>
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Cari produk... (contoh: Monstera, Pot, Pupuk)"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full p-4 pl-14 pr-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-600 transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-green-600 dark:text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Enhanced Quick Categories */}
          <div className="flex gap-3 overflow-x-auto pb-2 mt-6 px-2 scrollbar-hide">
            <button
              onClick={() => handleFilterChange('productType', 'all')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 shadow-md ${
              filters.productType === 'all' 
                ? 'bg-white text-green-600 shadow-lg scale-105' 
                : 'bg-green-500/20 text-white hover:bg-green-500/30 backdrop-blur-sm'
            }`}
            >
              🌿 Semua
            </button>
            <button
              onClick={() => handleFilterChange('productType', 'plants')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 shadow-md ${
                filters.productType === 'plants' 
                  ? 'bg-white text-green-600 shadow-lg scale-105' 
                  : 'bg-green-500/20 text-white hover:bg-green-500/30 backdrop-blur-sm'
              }`}
            >
              🌱 Tanaman Hias
            </button>
            <button
              onClick={() => handleFilterChange('productType', 'accessories')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 shadow-md ${
                filters.productType === 'accessories' 
                  ? 'bg-white text-green-600 shadow-lg scale-105' 
                  : 'bg-green-500/20 text-white hover:bg-green-500/30 backdrop-blur-sm'
              }`}
            >
              🪴 Aksesoris
            </button>
            <button
              onClick={() => handleFilterChange('durability', 'easy')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 shadow-md ${
                filters.durability === 'easy' 
                  ? 'bg-white text-green-600 shadow-lg scale-105' 
                  : 'bg-green-500/20 text-white hover:bg-green-500/30 backdrop-blur-sm'
              }`}
            >
              ⭐ Mudah Rawat
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex gap-6">
          {/* Enhanced Sidebar Filter */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-5 sticky top-24 transition-all duration-300 hover:shadow-2xl">
              {/* Filter Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-green-100 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  Filter
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-green-600 dark:text-green-400 text-sm font-semibold hover:text-green-700 dark:hover:text-green-300 transition-colors duration-300 px-3 py-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  Reset
                </button>
              </div>

              {/* Sort Options */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <span className="text-green-600">📊</span>
                  Urutkan
                </h4>
                <div className="space-y-2">
                  {[
                    { value: 'newest', label: 'Terbaru', icon: '🆕' },
                    { value: 'price_low', label: 'Harga Terendah', icon: '💰' },
                    { value: 'price_high', label: 'Harga Tertinggi', icon: '💎' },
                    { value: 'name', label: 'Nama A-Z', icon: '🔤' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('sort', option.value)}
                      className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-300 flex items-center gap-2 ${
                        filters.sort === option.value
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-md transform scale-105'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-700 hover:shadow-sm'
                      }`}
                    >
                      <span>{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <span className="text-green-600">🏷️</span>
                  Kategori
                </h4>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:border-green-300 dark:hover:border-green-600"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name_kategori || category.nama_kategori || category.title || category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Bar */}
            <div className="lg:hidden bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  Filter
                  {activeFiltersCount > 0 && (
                    <span className="bg-white text-green-600 text-xs px-1 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                
                <div className="text-sm text-gray-600">
                  {products.length} produk
                </div>

                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 ${viewMode === 'grid' ? 'bg-white text-green-600' : 'text-gray-500'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 ${viewMode === 'list' ? 'bg-white text-green-600' : 'text-gray-500'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Sort Bar */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Menampilkan <span className="font-bold text-green-600 dark:text-green-400 text-lg">{products.length}</span> produk
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Urutkan:</span>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="flex-1 sm:flex-none text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:border-green-300 dark:hover:border-green-600"
                  >
                    <option value="newest">🆕 Terbaru</option>
                    <option value="price_low">💰 Harga Terendah</option>
                    <option value="price_high">💎 Harga Tertinggi</option>
                    <option value="name">🔤 Nama A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {loading ? (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  : "space-y-4"
              }>
                {[...Array(8)].map((_, i) => (
                  <ProductCardSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  : "space-y-4"
              }>
              {products.map((product) => (
  <ProductCard 
    key={`${product.id}-${product.gambar_url}`}  // ✅ YANG BARU
    product={product} 
    viewMode={viewMode}
  />
))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="text-6xl mb-4">🌱</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Produk Tidak Ditemukan
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Maaf, tidak ada produk yang sesuai dengan filter yang Anda pilih.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Tampilkan Semua Produk
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showFilters && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 lg:hidden overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Filter Produk</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile Filter Content */}
              <div className="space-y-6">
                {/* Sort Options */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Urutkan</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'newest', label: 'Terbaru' },
                      { value: 'price_low', label: 'Harga Terendah' },
                      { value: 'price_high', label: 'Harga Tertinggi' },
                      { value: 'name', label: 'Nama A-Z' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleFilterChange('sort', option.value);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left p-3 rounded text-sm border ${
                          filters.sort === option.value
                            ? 'bg-green-50 text-green-600 border-green-200'
                            : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Kategori</h4>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name_kategori || category.nama_kategori || category.title || category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Durability */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Tingkat Perawatan</h4>
                  <select
                    value={filters.durability}
                    onChange={(e) => handleFilterChange('durability', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Semua Tingkat</option>
                    <option value="easy">Mudah</option>
                    <option value="medium">Sedang</option>
                    <option value="hard">Sulit</option>
                  </select>
                </div>

                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium"
                >
                  Reset Semua Filter
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>  
  );
};

export default Product;