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
  const { isAuthenticated } = useAuth();
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
    
    // Tambahkan produk ke cart dengan quantity yang dipilih
    await addToCart(product, finalQuantity);
    
    // Redirect langsung ke checkout
    navigate('/checkout');
    
  } catch (error) {
    console.error('❌ Error in buy now:', error);
    toast.error(error.message || 'Gagal memproses pembelian');
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-16 bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-16 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4 transition-colors duration-300">
            Produk tidak ditemukan
          </h2>
          <Link 
            to="/products"
            className="bg-emerald-600 dark:bg-emerald-700 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors duration-300"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mt-16 transition-colors duration-300">
      {/* Main Product Section */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4">
          {/* Navigation */}
          <Link 
            to="/products"
            className="mb-4 text-emerald-600 dark:text-emerald-400 hover:underline flex items-center text-sm transition-colors duration-300"
          >
            ← Kembali ke Katalog
          </Link>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            {/* Horizontal Layout for ALL screens */}
            <div className="flex flex-row gap-4 md:gap-8 p-4 md:p-8">
              {/* Product Image - Side by Side */}
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
              
              {/* Product Info - Side by Side */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="space-y-3 md:space-y-4">
                  <h1 className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white leading-tight transition-colors duration-300">
                    {product.nama_produk}
                  </h1>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <span className="text-lg md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 transition-colors duration-300">
                      Rp {product.harga?.toLocaleString('id-ID')}
                    </span>
                    <span className={`text-sm font-medium transition-colors duration-300 ${product.stok > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {product.stok > 0 ? `Stok: ${product.stok}` : 'Stok Habis'}
                    </span>
                  </div>
                  
                  {product.categories && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">Kategori:</span>
                      <span className="text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm transition-colors duration-300">
                        {product.categories.name_kategori || product.categories.nama_kategori || 'Tanaman'}
                      </span>
                    </div>
                  )}

                  {product.durability && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">Tingkat Perawatan:</span>
                      <span className="text-gray-700 dark:text-gray-200 capitalize text-sm transition-colors duration-300">
                        {product.durability}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Add to Cart & Buy Now */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 md:pt-6 mt-4 transition-colors duration-300">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-4">
                    <label className="text-gray-700 dark:text-gray-300 font-medium text-sm md:text-base transition-colors duration-300">Jumlah:</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="1"
                        max={product.stok}
                        value={quantityInput}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          
                          // Biarkan user mengetik dengan bebas (termasuk kosong sementara)
                          setQuantityInput(inputValue);
                          
                          // Parse dan validasi untuk update quantity state
                          const numValue = parseInt(inputValue, 10);
                          
                          if (inputValue === '' || isNaN(numValue)) {
                            // Biarkan input kosong atau invalid sementara, tidak update quantity
                            return;
                          }
                          
                          // Validasi dan update quantity
                          if (numValue < 1) {
                            setQuantity(1);
                          } else if (numValue > product.stok) {
                            // Tampilkan notifikasi jika melebihi stok
                            toast.error(`Stok tidak mencukupi. Stok tersedia: ${product.stok}`);
                            // Set ke stok maksimal
                            setQuantity(product.stok);
                            setQuantityInput(String(product.stok));
                          } else {
                            setQuantity(numValue);
                          }
                        }}
                        onBlur={(e) => {
                          // Saat kehilangan fokus, validasi dan normalisasi nilai
                          const inputValue = e.target.value.trim();
                          const numValue = parseInt(inputValue, 10);
                          
                          if (inputValue === '' || isNaN(numValue) || numValue < 1) {
                            setQuantity(1);
                            setQuantityInput('1');
                          } else if (numValue > product.stok) {
                            setQuantity(product.stok);
                            setQuantityInput(String(product.stok));
                            toast.error(`Stok tidak mencukupi. Stok tersedia: ${product.stok}`);
                          } else {
                            setQuantity(numValue);
                            setQuantityInput(String(numValue));
                          }
                        }}
                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm md:text-base transition-colors duration-300"
                      />
                      <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                        Stok: {product.stok}
                      </span>
                    </div>
                  </div>

                  {/* Button Group - Responsive Layout */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Buy Now Button - Primary Action */}
                    <button 
                      onClick={handleBuyNow}
                      disabled={product.stok === 0}
                      className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 text-sm md:text-base flex items-center justify-center gap-2 ${
                        product.stok === 0 
                          ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed text-gray-200 dark:text-gray-400' 
                          : 'bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02]'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {product.stok === 0 ? 'Stok Habis' : 'Beli Sekarang'}
                    </button>

                    {/* Add to Cart Button - Secondary Action */}
                    <button 
                      onClick={handleAddToCart}
                      disabled={product.stok === 0}
                      className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 text-sm md:text-base flex items-center justify-center gap-2 border-2 ${
                        product.stok === 0 
                          ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed text-gray-200 dark:text-gray-400 border-gray-400 dark:border-gray-700' 
                          : 'bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white border-emerald-600 dark:border-emerald-700 hover:border-emerald-700 dark:hover:border-emerald-600'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {product.stok === 0 ? 'Stok Habis' : !isAuthenticated ? 'Tambah ke Keranjang' : 'Tambah ke Keranjang'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Accordion Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mt-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            <div className="p-6 md:p-8">
              {/* Accordion Container */}
              <div className="space-y-4">
                {/* Deskripsi Produk Accordion */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
                  <button
                    onClick={() => toggleSection('deskripsi')}
                    className="flex justify-between items-center w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-300"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                      📖 Deskripsi Produk
                    </h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform ${
                        openSections.deskripsi ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {openSections.deskripsi && (
                    <div className="px-6 pb-6">
                      {product.deskripsi_lengkap ? (
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line transition-colors duration-300">
                          {product.deskripsi_lengkap}
                        </p>
                      ) : product.deskripsi ? (
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                          {product.deskripsi}
                        </p>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic transition-colors duration-300">
                          Deskripsi produk tidak tersedia.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Cara Perawatan Accordion */}
                {product.cara_perawatan && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
                    <button
                      onClick={() => toggleSection('perawatan')}
                      className="flex justify-between items-center w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-300"
                    >
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                        💧 Cara Perawatan
                      </h3>
                      <svg
                        className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform ${
                          openSections.perawatan ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {openSections.perawatan && (
                      <div className="px-6 pb-6">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line transition-colors duration-300">
                          {product.cara_perawatan}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="py-12 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                Produk Terkait Lainnya
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
                Temukan tanaman dan aksesoris berkebun lainnya yang mungkin Anda sukai
              </p>
            </div>

            {loadingRelated ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard 
                    key={relatedProduct.id} 
                    product={relatedProduct}
                    viewMode="grid"
                  />
                ))}
              </div>
            )}

            {/* View All Products CTA */}
            <div className="text-center mt-8">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Lihat Semua Produk
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;