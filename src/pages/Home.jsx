// src/pages/Home.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '../services/productsService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCart } from '../context/CartContext';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cart state for scroll behavior
  const { cartItems } = useCart();
  const prevCartCountRef = useRef(0);

  // Categories Data - Updated with richer visuals
  const categories = [
    {
      id: 1,
      name: 'Benih Unggul',
      image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=500&q=80',
      link: '/products?category=benih',
      color: 'bg-green-50',
    },
    {
      id: 2,
      name: 'Pupuk Nutrisi',
      image: 'https://images.unsplash.com/photo-1585314062604-1a357de8b000?auto=format&fit=crop&w=500&q=80',
      description: 'Makanan terbaik untuk tanaman',
      link: '/products?category=pupuk',
      color: 'bg-amber-50',

    },
    {
      id: 3,
      name: 'Tanaman Hias',
      image: 'https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&w=500&q=80',
      description: 'Cantikkan ruangan Anda',
      link: '/products?category=tanaman',
      color: 'bg-emerald-50',

    },
    {
      id: 4,
      name: 'Pot & Alat',
      image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=500&q=80',
      description: 'Perlengkapan berkebun',
      link: '/products?category=pot',
      color: 'bg-stone-50',

    }
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
    prevCartCountRef.current = cartItems.length;
  }, []);

  useEffect(() => {
    if (cartItems.length > prevCartCountRef.current) {
      // Optional: scroll top on add to cart
      // window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevCartCountRef.current = cartItems.length;
  }, [cartItems]);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getAllProducts();
      // Get 4 random products for variety or just first 4
      setFeaturedProducts(data.slice(0, 8));
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">

      {/* 🌿 HERO SECTION */}
      <section className="relative pt-24 pb-12 lg:pt-32 lg:pb-24 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-green-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-1/2 w-[500px] h-[500px] bg-emerald-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-0 w-[500px] h-[500px] bg-lime-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 gap-4 lg:gap-12 items-center">

            {/* Hero Text */}
            <div className="space-y-3 sm:space-y-6 text-left">
              <div className="inline-flex items-center px-2 py-1 sm:px-4 sm:py-2 rounded-full bg-green-50 text-green-700 border border-green-100 font-medium text-[10px] sm:text-sm animate-fade-in-up">
                <span className="mr-1 sm:mr-2">🍃</span> Premium Green House
              </div>

              <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight sm:leading-[1.15]">
                Hijaukan Ruangan <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                  Dengan Tanaman Kami
                </span>
              </h1>

              <p className="text-[10px] sm:text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed line-clamp-2 sm:line-clamp-none">
                Temukan koleksi tanaman hias terbaik yang siap menghidupkan setiap sudut rumah Anda.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-start pt-1 sm:pt-4">
                <Link
                  to="/products"
                  className="px-4 py-2 sm:px-8 sm:py-4 bg-green-600 text-white font-bold rounded-lg sm:rounded-xl shadow-lg hover:bg-green-700 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-base"
                >
                  Belanja
                  <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
                <Link
                  to="/about"
                  className="hidden sm:flex px-8 py-4 bg-white text-green-700 border border-green-200 font-bold rounded-xl hover:bg-green-50 transition-all duration-300 items-center justify-center"
                >
                  Tentang Kami
                </Link>
              </div>

              <div className="hidden sm:flex pt-8 items-center justify-start gap-8 text-sm text-gray-500 font-medium font-sans">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Tanaman Segar
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Dijamin Kualitas
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative ml-auto w-full max-w-[180px] sm:max-w-md lg:max-w-none">
              <div className="relative rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-2 sm:border-4 border-white/50">
                <img
                  src="https://images.unsplash.com/photo-1470058869958-2a77ade41c02?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Modern Green Home"
                  className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
                />

                {/* Floating Card - Visible on smaller screens but even smaller */}
                <div className="absolute bottom-2 left-2 sm:bottom-8 sm:left-8 bg-white/95 backdrop-blur-sm p-1.5 sm:p-4 rounded-lg sm:rounded-2xl shadow-xl border border-white/50 flex items-center gap-2 sm:gap-4 min-w-[100px] sm:min-w-[200px]">
                  <div className="w-6 h-6 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center text-xs sm:text-xl shadow-inner">
                    🏆
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-[8px] sm:text-sm">Segar</h3>
                    <p className="hidden sm:block text-xs text-gray-500">Dijamin kualitas</p>
                  </div>
                </div>
              </div>

              {/* Decorative Circle Behind */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-green-100/50 to-emerald-100/30 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 📦 CATEGORIES GRID */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Kategori Pilihan</h2>
            <div className="w-24 h-1.5 bg-green-500 mx-auto rounded-full"></div>
            <p className="mt-4 text-gray-600">Temukan apa yang Anda butuhkan untuk kebun Anda</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link to={cat.link} key={cat.id} className="group">
                <div className={`relative overflow-hidden rounded-3xl aspect-[4/5] ${cat.color} transition-all duration-300 hover:shadow-xl hover:-translate-y-2`}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="text-3xl mb-2">{cat.icon}</div>
                    <h3 className="text-xl font-bold mb-1">{cat.name}</h3>
                    <p className="text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{cat.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ✨ FEATURES SECTION */}
      <section className="py-16 bg-green-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🚚",
                title: "Pengiriman Cepat & Aman",
                desc: "Garansi tanaman hidup sampai tujuan dengan packing khusus."
              },
              {
                icon: "💎",
                title: "Kualitas Premium",
                desc: "Tanaman sehat yang dirawat oleh ahli hortikultura berpengalaman."
              },
              {
                icon: "🛡️",
                title: "Garansi Ganti Baru",
                desc: "Jika tanaman mati dalam perjalanan, kami ganti 100% gratis."
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 border border-green-50">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🛍️ FEATURED PRODUCTS */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <span className="text-green-600 font-bold tracking-wider uppercase text-sm">Koleksi Terbaru</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Tanaman Favorit</h2>
            </div>
            <Link to="/products" className="hidden md:flex items-center gap-2 text-green-600 font-bold hover:text-green-700 hover:underline">
              Lihat Semua Produk
              <span>→</span>
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 align-stretch">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center md:hidden">
            <Link to="/products" className="btn-primary w-full py-4 rounded-xl">Lihat Semua Produk</Link>
          </div>
        </div>
      </section>

      {/* 📧 NEWSLETTER / CTA */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-green-600 rounded-[2.5rem] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Siap Menghijaukan Rumahmu?</h2>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto relative z-10">
              Dapatkan diskon 10% untuk pembelian pertamamu dengan mendaftar newsletter kami. Tips perawatan gratis setiap minggu!
            </p>

            <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4 relative z-10" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Masukkan email Anda..."
                className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-green-400 placeholder-gray-400"
              />
              <button className="px-8 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
                Gabung
              </button>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;