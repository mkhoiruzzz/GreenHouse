// src/pages/Home.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '../services/productsService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import CategorySlider from '../components/CategorySlider';
import { useCart } from '../context/CartContext';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // TAMBAHKAN INI: Ambil cart dari context
  const { cartItems } = useCart();
  
  // TAMBAHKAN INI: Ref untuk melacak jumlah item cart sebelumnya
  const prevCartCountRef = useRef(0);

  // TAMBAHKAN INI: Scroll to top ketika komponen Home dimount
  useEffect(() => {
    // Scroll ke atas ketika halaman Home pertama kali dimuat
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []); // Empty dependency array - hanya sekali ketika komponen mount

  useEffect(() => {
    fetchFeaturedProducts();
    
    // TAMBAHKAN INI: Inisialisasi cart count
    prevCartCountRef.current = cartItems.length;
  }, []);

  // TAMBAHKAN INI: useEffect untuk mendeteksi perubahan cart dan scroll ke atas - SAMA SEPERTI DI CART.JSX
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

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getAllProducts();
      setFeaturedProducts(data.slice(0, 8));
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Compact dengan Gambar */}
      <section className="relative bg-white mt-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 md:gap-8 py-6 md:py-12 lg:py-16">
            {/* Text Content */}
            <div className="flex flex-col justify-center space-y-3 md:space-y-6">
              <div className="inline-flex items-center px-2 py-1 md:px-4 md:py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                <span className="text-xs font-medium">🌿 Premium Green House</span>
              </div>
              
              <h1 className="text-lg md:text-4xl lg:text-5xl font-bold text-gray-900 leading-snug">
                Hijaukan Ruangan
                <span className="block text-emerald-600 text-xs md:text-4xl lg:text-5xl">
                  Dengan Tanaman Kami
                </span>
              </h1>
              
              <p className="text-xs md:text-lg text-gray-600 leading-relaxed max-w-lg">
                Temukan koleksi tanaman hias terbaik yang siap menghidupkan setiap sudut rumah Anda. 
                Kualitas premium dengan harga terjangkau.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-4 pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center px-3 py-2 md:px-8 md:py-4 text-xs md:text-base font-semibold text-white bg-emerald-600 rounded-lg md:rounded-xl hover:bg-emerald-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <span>Belanja Sekarang</span>
                  <svg className="ml-1 w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center px-3 py-2 md:px-8 md:py-4 text-xs md:text-base font-semibold text-emerald-700 border border-emerald-200 md:border-2 rounded-lg md:rounded-xl hover:bg-emerald-50 transition-all duration-300"
                >
                  Tentang Kami
                </Link>
              </div>

              
              <div className="flex gap-4 md:gap-8 pt-3 md:pt-6">
              </div>
            </div>

            {/* Image Content */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-xs md:max-w-md">
                <div className="relative rounded-lg md:rounded-2xl overflow-hidden shadow-md md:shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80" 
                    alt="Beautiful indoor plants collection" 
                    className="w-full h-40 md:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                {/* Floating Card */}
                <div className="absolute -bottom-3 -left-3 md:-bottom-6 md:-left-6 bg-white rounded-lg md:rounded-2xl p-2 md:p-6 shadow-md md:shadow-2xl border border-gray-100 max-w-[150px] md:max-w-xs">
                  <div className="flex items-center space-x-1 md:space-x-3">
                    <div className="w-6 h-6 md:w-12 md:h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-sm md:text-2xl">🏆</span>
                    </div>
                    <div>
                      <div className="text-xs md:text-base font-bold text-gray-900">Tanaman Segar</div>
                      <div className="text-[10px] md:text-sm text-gray-500">Dijamin kualitas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Slider */}
      <section className="py-6 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CategorySlider />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-6 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-lg md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">
              Mengapa Memilih Kami?
            </h2>
            <p className="text-xs md:text-base text-gray-600 max-w-2xl mx-auto">
              Keunggulan yang membuat kami menjadi pilihan terbaik untuk kebutuhan tanaman Anda
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-6">
            {[
              {
                icon: '🚚',
                title: 'Gratis Ongkir',
                description: 'Pengiriman gratis untuk area tertentu dengan packing aman'
              },
              {
                icon: '🌱',
                title: 'Tanaman Segar',
                description: 'Dipetik langsung dari kebun dengan kualitas terjamin'
              },
              {
                icon: '💚',
                title: 'Perawatan Mudah',
                description: 'Panduan lengkap untuk perawatan tanaman pemula'
              },
              {
                icon: '📞',
                title: 'Support 24/7',
                description: 'Konsultasi gratis dengan ahli tanaman kami'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg p-3 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
              >
                <div className="text-xl md:text-3xl mb-2 md:mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-6 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 md:mb-12 gap-2 md:gap-4">
            <div>
              <h2 className="text-lg md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
                Produk Terbaru
              </h2>
              <p className="text-xs md:text-base text-gray-600">
                Koleksi tanaman hias terbaru yang siap mempercantik ruangan Anda
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center px-3 py-2 md:px-6 md:py-3 text-xs md:text-base text-emerald-600 hover:text-emerald-700 font-semibold transition-colors duration-300"
            >
              Lihat Semua
              <svg className="ml-1 w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-6 md:py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:gap-6">
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