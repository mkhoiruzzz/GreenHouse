// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '../services/productsService'; // ✅ PERBAIKI IMPORT
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import CategorySlider from '../components/CategorySlider';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      // ✅ PAKAI SUPABASE - Ambil semua produk
      const data = await productsService.getAllProducts();
      // Ambil 8 produk pertama untuk featured
      setFeaturedProducts(data.slice(0, 8));
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-accent text-white py-16 sm:py-24 md:py-32 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 fade-in">
            🌿 Selamat Datang di Green House 🌿
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 fade-in">
            Toko Tanaman Hias Terlengkap & Berkualitas
          </p>
          <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-3xl mx-auto fade-in px-4">
            Kami menyediakan berbagai jenis tanaman hias dengan sistem pengiriman
            yang disesuaikan dengan ketahanan tanaman. Tanaman rentan hanya dikirim
            ke Surabaya, sedangkan tanaman tahan lama dapat dikirim hingga Papua!
          </p>
          <Link
            to="/products"
            className="inline-block bg-white text-primary px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-bold hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Belanja Sekarang
          </Link>
        </div>
      </section>

      {/* Category Slider */}
      <CategorySlider />

      {/* Features Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-primary mb-8 sm:mb-12">
            Keunggulan Kami
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* ... existing features content ... */}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 gap-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
              Produk Terbaru
            </h2>
            <Link
              to="/products"
              className="text-secondary hover:text-accent font-semibold text-sm sm:text-base"
            >
              Lihat Semua →
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;