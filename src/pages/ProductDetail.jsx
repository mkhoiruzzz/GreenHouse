// src/pages/ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { productsService } from '../services/productsService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const { isAuthenticated, isAdmin } = useAuth();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1'); // State untuk input value saat user mengetik

  const [openSections, setOpenSections] = useState({
    deskripsi: true,
    perawatan: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    if (id) {
      fetchProductDetail();
      // Reset quantity saat produk berubah
      setQuantity(1);
      setQuantityInput('1');
    }
  }, [id]);

  // ✅ Handle hash scroll for #customer-reviews
  useEffect(() => {
    if (location.hash === '#customer-reviews' && !loading) {
      setTimeout(() => {
        const element = document.getElementById('customer-reviews');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500); // Tunggu sebentar sampai konten ter-render
    }
  }, [location.hash, loading]);

  const scrollToReviews = () => {
    const element = document.getElementById('customer-reviews');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching product detail with ID:', id);

      const productData = await productsService.getProductById(id);

      if (!productData) {
        throw new Error('Product not found');
      }

      console.log('📦 Full product data:', productData);
      console.log('💧 Cara perawatan exists:', !!productData.cara_perawatan);

      setProduct(productData);
      setQuantity(1);
      setQuantityInput('1');
      await fetchRelatedProducts(productData);

    } catch (error) {
      console.error('❌ Error fetching product:', error);
      toast.error('Gagal memuat detail produk');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (currentProduct) => {
    try {
      setLoadingRelated(true);
      const allProducts = await productsService.getAllProducts();

      const related = allProducts
        .filter(p =>
          p.id !== currentProduct.id &&
          (p.kategori_id === currentProduct.kategori_id ||
            p.categories?.id === currentProduct.categories?.id)
        )
        .slice(0, 4);

      if (related.length < 4) {
        const randomProducts = allProducts
          .filter(p => p.id !== currentProduct.id && !related.some(r => r.id === p.id))
          .slice(0, 4 - related.length);
        setRelatedProducts([...related, ...randomProducts]);
      } else {
        setRelatedProducts(related);
      }
    } catch (error) {
      console.error('❌ Error fetching related products:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      // ✅ Cek apakah user sudah login
      if (!isAuthenticated) {
        toast.info('Silakan login terlebih dahulu untuk menambahkan produk ke keranjang');
        // Simpan lokasi saat ini untuk redirect setelah login
        navigate('/login', {
          state: {
            from: location,
            message: 'Silakan login untuk melanjutkan'
          }
        });
        return;
      }

      if (!product) {
        toast.error('Produk tidak tersedia');
        return;
      }

      // Validasi quantity dari input atau state
      const finalQuantity = parseInt(quantityInput, 10) || quantity;

      if (finalQuantity < 1 || isNaN(finalQuantity)) {
        toast.error('Quantity harus minimal 1');
        setQuantity(1);
        setQuantityInput('1');
        return;
      }

      if (finalQuantity > product.stok) {
        toast.error(`Stok tidak mencukupi. Stok tersedia: ${product.stok}`);
        setQuantity(product.stok);
        setQuantityInput(String(product.stok));
        return;
      }

      // Update quantity state jika berbeda
      if (finalQuantity !== quantity) {
        setQuantity(finalQuantity);
        setQuantityInput(String(finalQuantity));
      }

      await addToCart(product, finalQuantity);
      toast.success(`${product.nama_produk} berhasil ditambahkan ke keranjang!`);

      setQuantity(1);
      setQuantityInput('1');

    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      toast.error(error.message || 'Gagal menambahkan ke keranjang');
    }
  };

  const handleBuyNow = async () => {
    try {
      // ✅ Cek apakah user sudah login
      if (!isAuthenticated) {
        toast.info('Silakan login terlebih dahulu untuk membeli produk');
        navigate('/login', {
          state: {
            from: location,
            message: 'Silakan login untuk melanjutkan pembelian'
          }
        });
        return;
      }

      if (!product) {
        toast.error('Produk tidak tersedia');
        return;
      }

      // Validasi quantity dari input atau state
      const finalQuantity = parseInt(quantityInput, 10) || quantity;

      if (finalQuantity < 1 || isNaN(finalQuantity)) {
        toast.error('Quantity harus minimal 1');
        setQuantity(1);
        setQuantityInput('1');
        return;
      }

      if (finalQuantity > product.stok) {
        toast.error(`Stok tidak mencukupi. Stok tersedia: ${product.stok}`);
        setQuantity(product.stok);
        setQuantityInput(String(product.stok));
        return;
      }

      // Update quantity state jika berbeda
      if (finalQuantity !== quantity) {
        setQuantity(finalQuantity);
        setQuantityInput(String(finalQuantity));
      }

      // ✅ CHANGE: Don't add to cart, instead pass to checkout via state
      // This differentiates "Buy Now" from "Add to Cart"
      navigate('/checkout', {
        state: {
          buyNowItem: {
            ...product,
            quantity: finalQuantity,
            isBuyNow: true
          }
        }
      });

    } catch (error) {
      console.error('❌ Error in buy now:', error);
      toast.error(error.message || 'Gagal memproses pembelian');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-16 bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-16 bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Produk tidak ditemukan
          </h2>
          <Link
            to="/products"
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-16 pb-12">
      {/* Main Product Section */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            to="/products"
            className="mb-4 text-emerald-600 hover:underline flex items-center text-sm"
          >
            ← Kembali ke Katalog
          </Link>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8">
              {/* Product Image */}
              <div className="flex-1 min-w-0">
                <img
                  src={product.gambar_url || product.gambar}
                  alt={product.nama_produk}
                  className="w-full h-48 md:h-96 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/600x400/4ade80/white?text=Gambar+Tidak+Tersedia';
                  }}
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="space-y-3 md:space-y-4">
                  <h1 className="text-lg md:text-3xl font-bold text-gray-900 leading-tight">
                    {product.nama_produk}
                  </h1>

                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                    <span className="text-2xl md:text-3xl font-bold text-emerald-600">
                      Rp {product.harga?.toLocaleString('id-ID')}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.stok > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stok > 0 ? `Stok: ${product.stok}` : 'Stok Habis'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={scrollToReviews}
                    className="flex items-center gap-4 mb-6 py-3 border-y border-gray-100 w-full hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={`text-lg ${star <= (product.avg_rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="font-bold text-gray-900 ml-1">{product.avg_rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-sm text-emerald-600 font-medium">({product.total_reviews || 0} Ulasan)</span>
                    </div>
                    <div className="w-[1px] h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-900">{product.total_sold || 0}</span>
                      <span className="text-sm text-gray-500">Terjual</span>
                    </div>
                    <div className="ml-auto text-emerald-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {product.categories && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Kategori:</span>
                      <span className="text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                        {product.categories.name_kategori || product.categories.nama_kategori || 'Tanaman'}
                      </span>
                    </div>
                  )}

                  {product.durability && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Tingkat Perawatan:</span>
                      <span className="text-gray-700 capitalize">
                        {product.durability}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 md:pt-6 mt-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-4">
                    <label className="text-gray-700 font-medium text-sm md:text-base">Jumlah:</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max={product.stok}
                        value={quantityInput}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          setQuantityInput(inputValue);
                          const numValue = parseInt(inputValue, 10);
                          if (inputValue === '' || isNaN(numValue)) return;
                          if (numValue < 1) setQuantity(1);
                          else if (numValue > product.stok) {
                            toast.error(`Stok tidak mencukupi. Stok tersedia: ${product.stok}`);
                            setQuantity(product.stok);
                            setQuantityInput(String(product.stok));
                          } else setQuantity(numValue);
                        }}
                        onBlur={(e) => {
                          const inputValue = e.target.value.trim();
                          const numValue = parseInt(inputValue, 10);
                          if (inputValue === '' || isNaN(numValue) || numValue < 1) {
                            setQuantity(1);
                            setQuantityInput('1');
                          } else if (numValue > product.stok) {
                            setQuantity(product.stok);
                            setQuantityInput(String(product.stok));
                          } else {
                            setQuantity(numValue);
                            setQuantityInput(String(numValue));
                          }
                        }}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 text-sm md:text-base"
                      />
                      <span className="text-xs md:text-sm text-gray-600">Stok: {product.stok}</span>
                    </div>
                  </div>

                  {!isAdmin ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleBuyNow}
                        disabled={product.stok === 0}
                        className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 text-sm md:text-base flex items-center justify-center gap-2 ${product.stok === 0 ? 'bg-gray-400 cursor-not-allowed text-gray-200' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md'}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        {product.stok === 0 ? 'Stok Habis' : 'Beli Sekarang'}
                      </button>

                      <button
                        onClick={handleAddToCart}
                        disabled={product.stok === 0}
                        className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 text-sm md:text-base flex items-center justify-center gap-2 border-2 ${product.stok === 0 ? 'bg-gray-400 cursor-not-allowed text-gray-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        {product.stok === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                      <p className="text-amber-700 font-bold flex items-center justify-center gap-2">
                        <span>🛡️</span> Anda masuk sebagai Admin. Fitur belanja dinonaktifkan.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Accordion Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
            <div className="p-6 md:p-8 space-y-4">
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('deskripsi')}
                  className="flex justify-between items-center w-full px-6 py-4 text-left hover:bg-gray-50 rounded-lg"
                >
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">📖 Deskripsi Produk</h3>
                  <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${openSections.deskripsi ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openSections.deskripsi && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {product.deskripsi_lengkap || product.deskripsi || 'Deskripsi produk tidak tersedia.'}
                    </p>
                  </div>
                )}
              </div>

              {product.cara_perawatan && (
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('perawatan')}
                    className="flex justify-between items-center w-full px-6 py-4 text-left hover:bg-gray-50 rounded-lg"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">💧 Cara Perawatan</h3>
                    <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${openSections.perawatan ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {openSections.perawatan && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.cara_perawatan}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Separated Reviews Section */}
          <div id="customer-reviews" className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 scroll-mt-24 overflow-hidden">
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                ⭐ Ulasan Pelanggan
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {product.total_reviews || 0} Ulasan
                </span>
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Rating Summary Card */}
                <div className="lg:col-span-1 bg-gray-50 rounded-2xl p-6">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-extrabold text-gray-900 mb-2">
                      {product.avg_rating?.toFixed(1) || '0.0'}
                    </div>
                    <div className="flex justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-2xl ${star <= Math.round(product.avg_rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                    <p className="text-gray-500 text-sm">Rata-rata rating dari pembeli</p>
                  </div>

                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = product.reviews?.filter(r => Math.round(r.rating) === star).length || 0;
                      const percentage = product.total_reviews > 0 ? (count / product.total_reviews) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 min-w-[35px]">
                            <span className="text-sm font-bold text-gray-700">{star}</span>
                            <span className="text-yellow-400 text-xs">★</span>
                          </div>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-500 min-w-[20px]">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Review List */}
                <div className="lg:col-span-2">
                  {product.reviews && product.reviews.length > 0 ? (
                    <div className="space-y-8">
                      {product.reviews.map((review, index) => (
                        <div key={review.id || index} className="border-b border-gray-100 pb-8 last:border-0">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">{(review.profiles?.username || review.user_name || 'U')[0]?.toUpperCase()}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">{review.profiles?.username || review.user_name || 'Pembeli'}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Pembeli Terverifikasi</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} className={`text-[10px] ${star <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                                  ))}
                                </div>
                                <span className="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                        <span className="text-4xl">🪴</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Ulasan Belum Tersedia</h3>
                      <p className="text-gray-500 text-center max-w-sm">Produk ini belum memiliki ulasan dari pembeli.<br />Jadilah yang pertama memberikan ulasan dan bantu orang lain memilih!</p>
                      <button onClick={() => toast.info('Anda bisa memberikan ulasan setelah menyelesaikan pesanan.')} className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md">Beri Ulasan Sekarang</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="py-12 bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Produk Terkait Lainnya</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Temukan tanaman dan aksesoris berkebun lainnya yang mungkin Anda sukai</p>
            </div>
            {loadingRelated ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} viewMode="grid" />
                ))}
              </div>
            )}
            <div className="text-center mt-8">
              <Link to="/products" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300">
                Lihat Semua Produk
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;