// src/pages/Product.jsx - PERBAIKI ERROR HANDLING
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
    <div className="min-h-screen mt-16 py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-3 md:px-4">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-primary mb-3 md:mb-4">
            Katalog Produk
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Temukan tanaman hias dan aksesoris berkebun favorit Anda
          </p>
        </div>

        {/* Product Type Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <h3 className="font-semibold text-primary mb-3">Jenis Produk:</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleFilterChange('productType', 'all')}
              className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${
                filters.productType === 'all' 
                  ? 'bg-secondary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua Produk
            </button>
            <button
              onClick={() => handleFilterChange('productType', 'plants')}
              className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${
                filters.productType === 'plants' 
                  ? 'bg-secondary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🌿 Tanaman Hias
            </button>
            <button
              onClick={() => handleFilterChange('productType', 'accessories')}
              className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${
                filters.productType === 'accessories' 
                  ? 'bg-secondary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🛠️ Aksesoris
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Cari produk..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            {/* Sort */}
            <div>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <option value="newest">Terbaru</option>
                <option value="price_low">Harga Terendah</option>
                <option value="price_high">Harga Tertinggi</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="text-secondary hover:underline text-sm"
            >
              Hapus Filter
            </button>
            <span className="text-gray-600 text-sm">
              {products.length} produk ditemukan
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Tidak ada produk yang ditemukan.</p>
            <button
              onClick={clearFilters}
              className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-secondary-dark"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>  
  );
};

export default Product;