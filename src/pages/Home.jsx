// src/pages/Home.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '../services/productsService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleItems, setVisibleItems] = useState(4);
  
  const { cartItems } = useCart();
  const { t } = useTheme();
  const prevCartCountRef = useRef(0);
  const sliderRef = useRef(null);

  // Categories data
  const categories = [
    {
      id: 1,
      name: t('Benih-Benih', 'Seeds'),
      image: 'https://ycwcbxbytdtmluzalofn.supabase.co/storage/v1/object/public/products/benih.png',
      description: t('Benih tanaman berkualitas', 'Quality plant seeds'),
      link: '/products?category=benih',
      gradient: 'from-green-400 to-emerald-600',
      iconBg: 'bg-green-100 dark:bg-green-800/30',
      borderColor: 'border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500'
    },
    {
      id: 2,
      name: t('Pupuk', 'Fertilizer'),
      image: 'https://ycwcbxbytdtmluzalofn.supabase.co/storage/v1/object/public/products/pupuk.png',
      description: t('Pupuk organik & kimia', 'Organic & chemical fertilizer'),
      link: '/products?category=pupuk',
      gradient: 'from-amber-400 to-orange-600',
      iconBg: 'bg-amber-100 dark:bg-amber-800/30',
      borderColor: 'border-amber-200 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-500'
    },
    {
      id: 3,
      name: t('Tanaman', 'Plants'),
      image: 'https://ycwcbxbytdtmluzalofn.supabase.co/storage/v1/object/public/products/tanaman.png',
      description: t('Berbagai jenis tanaman', 'Various types of plants'),
      link: '/products?category=tanaman',
      gradient: 'from-emerald-400 to-teal-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-800/30',
      borderColor: 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500'
    },
    {
      id: 4,
      name: t('Pot', 'Pots'),
      image: 'https://ycwcbxbytdtmluzalofn.supabase.co/storage/v1/object/public/products/pot.png',
      description: t('Berbagai jenis pot', 'Various types of pots'),
      link: '/products?category=pot',
      gradient: 'from-rose-400 to-pink-600',
      iconBg: 'bg-rose-100 dark:bg-rose-800/30',
      borderColor: 'border-rose-200 dark:border-rose-700 hover:border-rose-400 dark:hover:border-rose-500'
    }
  ];

  // Calculate visible items based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleItems(2);
      } else if (window.innerWidth < 1024) {
        setVisibleItems(3);
      } else {
        setVisibleItems(4);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto slide
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex >= Math.ceil(categories.length / visibleItems) - 1 ? 0 : prevIndex + 1
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [currentIndex, isPaused, categories.length, visibleItems]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
    prevCartCountRef.current = cartItems.length;
  }, []);

  useEffect(() => {
    if (cartItems.length > prevCartCountRef.current) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevCartCountRef.current = cartItems.length;
  }, [cartItems]);

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

  const nextSlide = () => {
    const maxIndex = Math.ceil(categories.length / visibleItems) - 1;
    setCurrentIndex(currentIndex >= maxIndex ? 0 : currentIndex + 1);
  };

  const prevSlide = () => {
    const maxIndex = Math.ceil(categories.length / visibleItems) - 1;
    setCurrentIndex(currentIndex === 0 ? maxIndex : currentIndex - 1);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const translateX = currentIndex * (100 / visibleItems) * visibleItems;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative bg-white dark:bg-gray-800 mt-16 border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 md:gap-8 py-6 md:py-12 lg:py-16">
            {/* Text Content */}
            <div className="flex flex-col justify-center space-y-3 md:space-y-6">
              <div className="inline-flex items-center px-2 py-1 md:px-4 md:py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 mb-1">
                <span className="text-xs font-medium">🌿 Premium Green House</span>
              </div>
              
              <h1 className="text-lg md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-snug transition-colors duration-300">
                {t('Hijaukan Ruangan', 'Green Your Space')}
                <span className="block text-emerald-600 dark:text-emerald-400 text-xs md:text-4xl lg:text-5xl">
                  {t('Dengan Tanaman Kami', 'With Our Plants')}
                </span>
              </h1>
              
              <p className="text-xs md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg transition-colors duration-300">
                {t(
                  'Temukan koleksi tanaman hias terbaik yang siap menghidupkan setiap sudut rumah Anda. Kualitas premium dengan harga terjangkau.',
                  'Discover the best collection of ornamental plants ready to enliven every corner of your home. Premium quality at affordable prices.'
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-4 pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center px-3 py-2 md:px-8 md:py-4 text-xs md:text-base font-semibold text-white bg-emerald-600 dark:bg-emerald-700 rounded-lg md:rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <span>{t('Belanja Sekarang', 'Shop Now')}</span>
                  <svg className="ml-1 w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center px-3 py-2 md:px-8 md:py-4 text-xs md:text-base font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-600 md:border-2 rounded-lg md:rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-300"
                >
                  {t('Tentang Kami', 'About Us')}
                </Link>
              </div>
            </div>

            {/* Image Content */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-xs md:max-w-md">
                <div className="relative rounded-lg md:rounded-2xl overflow-hidden shadow-md md:shadow-2xl dark:shadow-gray-900/50">
                  <img 
                    src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80" 
                    alt="Beautiful indoor plants collection" 
                    className="w-full h-40 md:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                {/* Floating Card */}
                <div className="absolute -bottom-3 -left-3 md:-bottom-6 md:-left-6 bg-white dark:bg-gray-800 rounded-lg md:rounded-2xl p-2 md:p-6 shadow-md md:shadow-2xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 max-w-[150px] md:max-w-xs transition-colors duration-300">
                  <div className="flex items-center space-x-1 md:space-x-3">
                    <div className="w-6 h-6 md:w-12 md:h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                      <span className="text-sm md:text-2xl">🏆</span>
                    </div>
                    <div>
                      <div className="text-xs md:text-base font-bold text-gray-900 dark:text-white">
                        {t('Tanaman Segar', 'Fresh Plants')}
                      </div>
                      <div className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400">
                        {t('Dijamin kualitas', 'Quality guaranteed')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Slider - Integrated */}
     <section className="bg-white dark:bg-gray-800 transition-colors duration-300">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 transition-colors duration-300">
                {t('Kategori Pilihan', 'Featured Categories')}
              </h2>
              <div className="w-16 md:w-20 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
            </div>

            {/* Navigation Buttons - Desktop */}
            <div className="hidden md:flex gap-2">
              <button
                onClick={prevSlide}
                className="p-3 rounded-xl bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-300 group shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="p-3 rounded-xl bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-300 group shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Slider */}
          <div 
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="overflow-hidden rounded-2xl">
              <div 
                ref={sliderRef}
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${translateX}%)` }}
              >
                {categories.map((category) => (
                  <div 
                    key={category.id} 
                    className={`flex-shrink-0 px-2 ${
                      visibleItems === 2 ? 'w-1/2' : 
                      visibleItems === 3 ? 'w-1/3' : 'w-1/4'
                    }`}
                  >
                    <Link
                      to={category.link}
                      className="block group"
                    >
                      <div className={`
                        relative bg-white dark:bg-gray-700 rounded-2xl 
                        border-2 ${category.borderColor}
                        overflow-hidden
                        transition-all duration-300
                        hover:shadow-xl dark:hover:shadow-emerald-500/10
                        hover:-translate-y-2
                      `}>
                        {/* Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 z-10`}></div>
                        
                        {/* Image Container */}
                        <div className="relative h-32 md:h-40 bg-gray-100 dark:bg-gray-600 overflow-hidden">
                          <img 
                            src={category.image} 
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {/* Dark overlay on hover */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="relative p-4 text-center">
                          <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                            {category.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {category.description}
                          </p>

                          {/* Arrow indicator on hover */}
                          <div className="mt-2 flex items-center justify-center text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <span className="text-xs font-semibold mr-1">{t('Lihat', 'View')}</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>

                        {/* Badge */}
                        <div className={`absolute top-3 right-3 ${category.iconBg} px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">New</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: Math.ceil(categories.length / visibleItems) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-emerald-500 w-8' 
                      : 'bg-gray-300 dark:bg-gray-600 w-2 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* View All Button */}
          <div className="text-center mt-8">
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 text-sm md:text-base font-semibold text-emerald-600 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 group shadow-sm hover:shadow-md"
            >
              {t('Lihat Semua Kategori', 'View All Categories')}
              <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-6 md:py-16 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white mb-2 md:mb-4 transition-colors duration-300">
              {t('Mengapa Memilih Kami?', 'Why Choose Us?')}
            </h2>
            <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
              {t(
                'Keunggulan yang membuat kami menjadi pilihan terbaik untuk kebutuhan tanaman Anda',
                'The advantages that make us the best choice for your plant needs'
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-6">
            {[
              {
                icon: '🚚',
                title: t('Gratis Ongkir', 'Free Shipping'),
                description: t('Pengiriman gratis untuk area tertentu dengan packing aman', 'Free shipping for certain areas with safe packing')
              },
              {
                icon: '🌱',
                title: t('Tanaman Segar', 'Fresh Plants'),
                description: t('Dipetik langsung dari kebun dengan kualitas terjamin', 'Picked directly from the garden with guaranteed quality')
              },
              {
                icon: '💚',
                title: t('Perawatan Mudah', 'Easy Care'),
                description: t('Panduan lengkap untuk perawatan tanaman pemula', 'Complete guide for beginner plant care')
              },
              {
                icon: '📞',
                title: t('Support 24/7', 'Support 24/7'),
                description: t('Konsultasi gratis dengan ahli tanaman kami', 'Free consultation with our plant experts')
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-md dark:shadow-gray-900/50 transition-all duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="text-xl md:text-3xl mb-2 md:mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white mb-1 md:mb-2 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-6 md:py-16 bg-white dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 md:mb-12 gap-2 md:gap-4">
            <div>
              <h2 className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 transition-colors duration-300">
                {t('Produk Terbaru', 'Latest Products')}
              </h2>
              <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 transition-colors duration-300">
                {t(
                  'Koleksi tanaman hias terbaru yang siap mempercantik ruangan Anda',
                  'The latest collection of ornamental plants ready to beautify your room'
                )}
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center px-3 py-2 md:px-6 md:py-3 text-xs md:text-base text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold transition-colors duration-300"
            >
              {t('Lihat Semua', 'View All')}
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