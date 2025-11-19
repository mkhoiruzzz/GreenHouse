// src/pages/Product.jsx - MODERN E-COMMERCE LAYOUT
import { useState, useEffect, useRef } from 'react'; // TAMBAHKAN useRef
import { productsService } from '../services/productsService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext'; // TAMBAHKAN IMPORT INI

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

  // TAMBAHKAN INI: Ambil cart dari context
  const { cartItems } = useCart();
  
  // TAMBAHKAN INI: Ref untuk melacak jumlah item cart sebelumnya
  const prevCartCountRef = useRef(0);

  // TAMBAHKAN INI: Scroll to top ketika komponen Product dimount
  useEffect(() => {
    // Scroll ke atas ketika halaman Product pertama kali dimuat
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []); // Empty dependency array - hanya sekali ketika komponen mount

  useEffect(() => {
    console.log('🔄 Product component mounted');
    fetchCategories();
    fetchProducts();
    
    // TAMBAHKAN INI: Inisialisasi cart count
    prevCartCountRef.current = cartItems.length;
  }, []);

  useEffect(() => {
    console.log('🔄 Filters changed:', filters);
    fetchProducts();
  }, [filters]);

  // TAMBAHKAN INI: useEffect untuk mendeteksi perubahan cart dan scroll ke atas
  useEffect(() => {
    // Scroll ke atas ketika cart items berubah (ketika ada penambahan item)
    if (cartItems.length > prevCartCountRef.current) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    
    // Update previous cart count
    prevCartCountRef.current = cartItems.length;
  }, [cartItems]); // Trigger ketika cartItems berubah

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
      console.log('✅ Raw products from service:', allProducts);
      
      let filteredProducts = allProducts;
      
      // Filter berdasarkan search
      if (filters.search) {
        filteredProducts = filteredProducts.filter(product =>
          product.nama_produk.toLowerCase().includes(filters.search.toLowerCase()) ||
          product.deskripsi.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      // Filter berdasarkan category
      if (filters.category) {
        filteredProducts = filteredProducts.filter(product =>
          product.kategori_id == filters.category
        );
      }
      
      // Filter berdasarkan durability
      if (filters.durability) {
        filteredProducts = filteredProducts.filter(product =>
          product.durability === filters.durability
        );
      }
      
      
      // Filter berdasarkan productType
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
      
      // Sort products
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

  // Quick filter chips
  const quickFilters = [
    { value: 'plants', label: '🌿 Tanaman Hias', type: 'productType' },
    { value: 'accessories', label: '🛠️ Aksesoris', type: 'productType' },
    { value: 'easy', label: '👍 Mudah Rawat', type: 'durability' },
  ];

  const handleQuickFilter = (filter) => {
    if (filters[filter.type] === filter.value) {
      // If already active, remove it
      handleFilterChange(filter.type, filter.type === 'productType' ? 'all' : '');
    } else {
      // Activate the filter
      handleFilterChange(filter.type, filter.value);
    }
  };

  const isQuickFilterActive = (filter) => {
    return filters[filter.type] === filter.value;
  };

  // ProductCard Skeleton Component
  const ProductCardSkeleton = ({ viewMode }) => {
    if (viewMode === 'list') {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="flex gap-4">
            <div className="w-32 h-32 bg-gray-300 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded mb-3 w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded mb-2 w-1/2"></div>
              <div className="h-3 bg-gray-300 rounded mb-4 w-2/3"></div>
              <div className="h-6 bg-gray-300 rounded w-20 mb-2"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
                <div className="h-10 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
        <div className="w-full h-48 bg-gray-300"></div>
        <div className="p-4">
          <div className="h-4 bg-gray-300 rounded mb-3"></div>
          <div className="h-3 bg-gray-300 rounded mb-2 w-2/3"></div>
          <div className="h-6 bg-gray-300 rounded w-20 mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-300 rounded w-16"></div>
            <div className="h-10 bg-gray-300 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen mt-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Quick Stats Bar dengan Quick Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{products.length}</div>
                <div className="text-sm text-gray-500 font-medium">Produk Tersedia</div>
              </div>
              <div className="h-8 w-px bg-gray-300 hidden sm:block"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{categories.length}</div>
                <div className="text-sm text-gray-500 font-medium">Kategori</div>
              </div>
            </div>
            
            {/* Quick Filter Chips */}
            <div className="flex-1 max-w-2xl">
              <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => handleQuickFilter(filter)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      isQuickFilterActive(filter)
                        ? 'bg-emerald-500 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white text-emerald-600 shadow-lg transform scale-105' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Grid view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white text-emerald-600 shadow-lg transform scale-105' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="List view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="appearance-none border border-gray-300 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
                  aria-label="Sort products by"
                >
                  <option value="newest">📅 Terbaru</option>
                  <option value="name">🔤 Nama A-Z</option>
                  <option value="price_low">💰 Harga: Rendah ke Tinggi</option>
                  <option value="price_high">💎 Harga: Tinggi ke Rendah</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Sidebar Filters */}
          <div className={`lg:w-80 ${showFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sticky top-24">
              {/* Filter Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Filter Produk</h3>
                </div>
                <div className="flex items-center gap-3">
                  {activeFiltersCount > 0 && (
                    <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
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
                <label className="block text-sm font-semibold text-gray-700 mb-3">🔍 Cari Produk</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari produk atau deskripsi..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full p-4 pl-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all"
                    aria-label="Search products"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Collapsible Sections */}
              <div className="space-y-4">
                {/* Product Type */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('productType')}
                    className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-semibold text-gray-800">🎯 Jenis Produk</span>
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
                    <div className="p-4 space-y-3 bg-white">
                      {[
                        { value: 'all', label: '🌿 Semua Produk', emoji: '' },
                        { value: 'plants', label: '🌱 Tanaman', emoji: '' },
                        { value: 'accessories', label: '🛠️ Benih Dan Pupuk', emoji: '' }
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => handleFilterChange('productType', type.value)}
                          className={`w-full text-left p-3 rounded-lg font-medium transition-all flex items-center gap-3 ${
                            filters.productType === type.value 
                              ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200 shadow-sm' 
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
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
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('categories')}
                    className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-semibold text-gray-800">📂 Kategori</span>
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
                    <div className="p-4 bg-white">
                      <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                        aria-label="Filter by category"
                      >
                        <option value="">📁 Semua Kategori</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name_kategori || category.nama_kategori}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Durability */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('durability')}
                    className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-semibold text-gray-800">💪 Tingkat Perawatan</span>
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
                    <div className="p-4 bg-white">
                      <select
                        value={filters.durability}
                        onChange={(e) => handleFilterChange('durability', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                        aria-label="Filter by maintenance level"
                      >
                        <option value="">🌟 Semua Tingkat</option>
                        <option value="easy">👍 Mudah</option>
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
            <div className="lg:hidden bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-3 bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg"
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
                
                <div className="text-sm text-gray-600 font-medium">
                  Menampilkan <span className="font-bold text-emerald-600">{products.length}</span> produk
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
              <div className="text-center py-20 bg-white rounded-2xl shadow-xl border border-gray-200">
                <div className="text-8xl mb-6">🌱</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Produk Tidak Ditemukan
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  Maaf, tidak ada produk yang sesuai dengan filter yang Anda pilih. Coba ubah filter atau kata kunci pencarian.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={clearFilters}
                    className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    🔄 Tampilkan Semua Produk
                  </button>
                  <button
                    onClick={() => setShowFilters(true)}
                    className="border-2 border-emerald-500 text-emerald-500 px-8 py-4 rounded-xl font-semibold hover:bg-emerald-50 transition-all duration-200"
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