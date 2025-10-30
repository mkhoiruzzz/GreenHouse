// src/pages/Product.jsx - IMPROVED LAYOUT & STYLING
import { useState, useEffect } from 'react';
import { productsService } from '../services/productsService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

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
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    console.log('🔄 Product component mounted');
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    console.log('🔄 Filters changed:', filters);
    fetchProducts();
  }, [filters]);

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
        
        // Filter tambahan untuk aksesoris berdasarkan category
        if (filters.category) {
          if (filters.category === 'benih') {
            filteredProducts = filteredProducts.filter(product =>
              product.categories?.name_kategori.toLowerCase().includes('benih')
            );
          } else if (filters.category === 'pupuk') {
            filteredProducts = filteredProducts.filter(product =>
              product.categories?.name_kategori.toLowerCase().includes('pupuk')
            );
          } else if (filters.category === 'pot') {
            filteredProducts = filteredProducts.filter(product =>
              product.categories?.name_kategori.toLowerCase().includes('pot')
            );
          }
        }
      }
      
      // Sort products
      if (filters.sort === 'newest') {
        filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (filters.sort === 'price_low') {
        filteredProducts.sort((a, b) => a.harga - b.harga);
      } else if (filters.sort === 'price_high') {
        filteredProducts.sort((a, b) => b.harga - a.harga);
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
    });
  };

  return (
    <div className="min-h-screen mt-16 py-4 md:py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 md:px-4">
        {/* Header dengan Background Gradient */}
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-3 md:mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Katalog Produk
          </h1>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            Temukan tanaman hias dan aksesoris berkebun favorit Anda dengan kualitas terbaik
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters - Hidden on mobile, shown with toggle */}
          <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 sticky top-24">
              {/* Filter Toggle for Mobile */}
              <div className="flex justify-between items-center mb-4 lg:hidden">
                <h3 className="font-bold text-lg text-gray-800">Filter Produk</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Product Type */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Jenis Produk</h4>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: '🌿 Semua Produk', color: 'bg-blue-100 text-blue-800' },
                    { value: 'plants', label: '🌱 Tanaman Hias', color: 'bg-green-100 text-green-800' },
                    { value: 'accessories', label: '🛠️ Aksesoris', color: 'bg-orange-100 text-orange-800' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleFilterChange('productType', type.value)}
                      className={`w-full text-left p-3 rounded-lg font-medium transition-all ${
                        filters.productType === type.value 
                          ? `${type.color} shadow-md` 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Kategori</h4>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name_kategori || category.nama_kategori}
                    </option>
                  ))}
                </select>
              </div>

              {/* Durability */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Tingkat Perawatan</h4>
                <select
                  value={filters.durability}
                  onChange={(e) => handleFilterChange('durability', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
                >
                  <option value="">Semua Tingkat</option>
                  <option value="easy">Mudah</option>
                  <option value="medium">Sedang</option>
                  <option value="hard">Sulit</option>
                </select>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Urutkan</h4>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
                >
                  <option value="newest">Terbaru</option>
                  <option value="price_low">Harga Terendah</option>
                  <option value="price_high">Harga Tertinggi</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-300"
              >
                🔄 Reset Filter
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Top Bar dengan Search dan Filter Toggle */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Search Bar */}
                <div className="flex-1 w-full md:w-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari produk, tanaman, aksesoris..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🔍
                    </div>
                  </div>
                </div>

                {/* Filter Toggle & Results */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden bg-secondary text-white px-4 py-3 rounded-lg font-semibold hover:bg-secondary-dark transition-colors flex items-center gap-2"
                  >
                    <span>📊</span>
                    Filter
                  </button>
                  
                  <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                    📦 {products.length} produk ditemukan
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid - 2 kolom untuk mobile, 3 kolom untuk desktop */}
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <LoadingSpinner />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl shadow-lg">
                <div className="text-6xl mb-4">🌱</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Produk Tidak Ditemukan
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Maaf, tidak ada produk yang sesuai dengan filter yang Anda pilih. Coba ubah filter atau kata kunci pencarian.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-secondary text-white px-8 py-3 rounded-lg font-semibold hover:bg-secondary-dark transition-colors"
                >
                  Tampilkan Semua Produk
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>  
  );
};

export default Product;