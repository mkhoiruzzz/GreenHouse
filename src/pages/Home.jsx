// src/pages/Home.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '../services/productsService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import BannerSlider from '../components/BannerSlider';
import { useCart } from '../context/CartContext';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTesti, setLoadingTesti] = useState(true);

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
    fetchTestimonials();
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

  const fetchTestimonials = async () => {
    try {
      setLoadingTesti(true);
      const data = await productsService.getLatestReviews(6);
      setTestimonials(data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoadingTesti(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">

      {/* 🌿 HERO SECTION */}
      <section className="relative pt-0 pb-0 overflow-hidden">
        <BannerSlider />
      </section>

      {/* 📦 CATEGORIES GRID */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Kategori Pilihan</h2>
            <div className="w-24 h-1.5 bg-green-500 mx-auto rounded-full"></div>
            <p className="mt-4 text-gray-600">Temukan apa yang Anda butuhkan untuk kebun Anda</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {categories.map((cat) => (
              <Link to={cat.link} key={cat.id} className="group flex flex-col items-center">
                <div className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-lg ${cat.color} transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105 ring-4 ring-white group-hover:ring-green-100`}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-800 group-hover:text-green-600 transition-colors text-center">
                  {cat.name}
                </h3>
                <p className="text-sm text-gray-500 text-center mt-1 opacity-0 md:opacity-100 transition-opacity">
                  {cat.description}
                </p>
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

      {/* 💬 TESTIMONIALS SECTION */}
      {((!loadingTesti && testimonials.length > 0) || loadingTesti) && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Kata Mereka Tentang Kami</h2>
              <div className="w-24 h-1.5 bg-green-500 mx-auto rounded-full"></div>
              <p className="mt-4 text-gray-600">Pelanggan puas dengan layanan Green House</p>
            </div>

            {loadingTesti ? (
              <div className="flex justify-center"><LoadingSpinner /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {testimonials.map((testi, idx) => (
                  <div key={testi.id || idx} className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 relative group">
                    <div className="absolute top-6 right-8 text-green-100 text-6xl font-serif opacity-50 group-hover:opacity-100 transition-opacity">"</div>

                    <div className="flex items-center gap-1 mb-3 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= testi.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                      ))}
                    </div>

                    {testi.products?.nama_produk && (
                      <div className="mb-3">
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded">
                          Produk: {testi.products.nama_produk}
                        </span>
                      </div>
                    )}

                    <p className="text-gray-600 mb-6 relative z-10 leading-relaxed italic line-clamp-4">
                      "{testi.comment || 'Puas sekali dengan tanamannya!'}"
                    </p>

                    <div className="flex items-center gap-4 border-t border-gray-50 pt-6">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold overflow-hidden shadow-inner">
                        {testi.profiles?.avatar_url ? (
                          <img
                            src={testi.profiles.avatar_url}
                            alt={testi.profiles.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{(testi.profiles?.username || 'U')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{testi.profiles?.username || 'Pelanggan Setia'}</h4>
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-blue-500 text-white rounded-full flex items-center justify-center text-[6px]">✓</span>
                          <p className="text-[10px] text-gray-400 font-medium">Verified Buyer</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

    </div>
  );
};

export default Home;