// Accessories.jsx - Halaman khusus benih, pupuk, dan pot
import { useState, useEffect } from 'react';
import { productsService } from '../services/productsService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const Accessories = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    durability: '',
    sort: 'newest',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Kategori khusus untuk aksesoris (benih, pupuk, pot)
  const accessoryCategories = ['benih', 'pupuk', 'pot', 'bibit', 'seeds', 'fertilizer', 'pot'];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAccessoryProducts();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      // Filter hanya kategori yang termasuk aksesoris
      const accessoryCats = response.data.categories.filter(cat => 
        accessoryCategories.some(keyword => 
          cat.nama_kategori.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      setCategories(accessoryCats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAccessoryProducts = async () => {
    try {
      setLoading(true);
      // Tambahkan filter khusus untuk produk aksesoris
      const data = await productService.getAllProducts({
        ...filters,
        accessory: true // Flag khusus untuk aksesoris
      });
      
      // Filter produk yang termasuk dalam kategori aksesoris
      const accessoryProducts = data.products.filter(product => 
        accessoryCategories.some(keyword => 
          product.nama_kategori.toLowerCase().includes(keyword.toLowerCase()) ||
          product.nama_produk.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      setProducts(accessoryProducts);
    } catch (error) {
      console.error('Error fetching accessory products:', error);
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
    });
  };

  // Kategori khusus untuk filter
  const accessoryFilterCategories = [
    { id: 'benih', name: '🌱 Benih & Bibit', keywords: ['benih', 'bibit', 'seeds'] },
    { id: 'pupuk', name: '🧪 Pupuk & Nutrisi', keywords: ['pupuk', 'fertilizer', 'nutrisi'] },
    { id: 'pot', name: '🏺 Pot & Wadah', keywords: ['pot', 'wadah', 'planter'] }
  ];

  return (
    <div className="min-h-screen mt-16 py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-3 md:px-4">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-primary mb-3 md:mb-4">
            Aksesoris Tanaman
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Lengkapi kebutuhan berkebun Anda dengan benih, pupuk, dan pot berkualitas
          </p>
        </div>

        {/* Quick Category Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <h3 className="font-semibold text-primary mb-3">Kategori Aksesoris:</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleFilterChange('category', '')}
              className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${
                filters.category === '' 
                  ? 'bg-secondary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua
            </button>
            {accessoryFilterCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleFilterChange('category', cat.id)}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${
                  filters.category === cat.id 
                    ? 'bg-secondary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 font-semibold text-primary flex items-center justify-between"
          >
            <span>Filter & Sort</span>
            <span>{showFilters ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* Filters */}
        <div className={`bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 ${
          showFilters ? 'block' : 'hidden md:block'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-primary mb-2">
                Cari Aksesoris
              </label>
              <input
                type="text"
                placeholder="Cari benih, pupuk, pot..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent text-sm md:text-base"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                Tipe Aksesoris
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent text-sm md:text-base"
              >
                <option value="">Semua Tipe</option>
                {accessoryFilterCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                Urutkan
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent text-sm md:text-base"
              >
                <option value="newest">Terbaru</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="price_desc">Harga Tertinggi</option>
                <option value="name_asc">Nama A-Z</option>
                <option value="name_desc">Nama Z-A</option>
              </select>
            </div>

            {/* Clear Filters Button - Mobile Only */}
            <div className="md:hidden col-span-2">
              <button
                onClick={clearFilters}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* Products Count */}
        {!loading && products.length > 0 && (
          <div className="mb-4 text-gray-600 text-sm md:text-base">
            Menampilkan {products.length} aksesoris tanaman
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-16">
            <div className="text-4xl md:text-6xl mb-4">🔍</div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-600 mb-2">
              Aksesoris Tidak Ditemukan
            </h3>
            <p className="text-gray-500 text-sm md:text-base mb-4">
              Coba ubah filter atau kata kunci pencarian Anda
            </p>
            <button
              onClick={clearFilters}
              className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition text-sm md:text-base"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Accessories;