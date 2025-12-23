import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';

const ProductCard = ({ product, viewMode }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const imgRef = useRef(null);
  
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t } = useTheme();

  // ✅ FIX UTAMA: Reset state setiap kali product atau gambar URL berubah
  useEffect(() => {
    const newImageUrl = product?.gambar_url || product?.gambar || '';
    
    // Hanya reset jika URL benar-benar berubah
    if (newImageUrl !== currentImageUrl) {
      console.log('🔄 Image URL changed for product:', product?.id, 'Old:', currentImageUrl, 'New:', newImageUrl);
      setImageLoaded(false);
      setImageError(false);
      setCurrentImageUrl(newImageUrl);
      
      // Force re-render image element
      if (imgRef.current) {
        imgRef.current.src = newImageUrl || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia';
      }
    }
  }, [product?.id, product?.gambar_url, product?.gambar]);

  if (!product) {
    console.error('❌ ProductCard: Product data is null or undefined');
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 transition-colors duration-300">
        <p className="text-red-600 dark:text-red-400 font-semibold transition-colors duration-300">
          ⚠️ {t('Error: Data produk tidak tersedia', 'Error: Product data missing')}
        </p>
      </div>
    );
  }

  if (!product.id) {
    console.error('❌ ProductCard: Product ID is missing', product);
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 transition-colors duration-300">
        <p className="text-red-600 dark:text-red-400 font-semibold transition-colors duration-300">
          ⚠️ {t('Error: ID produk tidak tersedia', 'Error: Product ID missing')}
        </p>
      </div>
    );
  }

  const handleCardClick = () => {
    try {
      console.log('🖱️ Card clicked, navigating to product:', product.id);
      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error('❌ Error navigating from card click:', error);
      toast.error(t('Gagal membuka detail produk', 'Failed to open product details'));
    }
  };

  const handleImageClick = (e) => {
    try {
      e.stopPropagation();
      console.log('🖼️ Image clicked, navigating to product:', product.id);
      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error('❌ Error navigating from image click:', error);
      toast.error(t('Gagal membuka detail produk', 'Failed to open product details'));
    }
  };

  const handleBuyClick = (e) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation();
      }
      
      console.log('🛒 Buy button clicked, navigating to product:', product.id);
      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error('❌ Error navigating from buy button:', error);
      toast.error(t('Gagal membuka detail produk', 'Failed to open product details'));
    }
  };

  const formatPrice = (price) => {
    try {
      if (!price || isNaN(price)) {
        console.warn('⚠️ Invalid price:', price);
        return 'Rp 0';
      }
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(price);
    } catch (error) {
      console.error('❌ Error formatting price:', error);
      return 'Rp 0';
    }
  };

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully for product:', product.id);
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e) => {
    console.error('❌ Image failed to load for product:', product.id, 'URL:', currentImageUrl);
    setImageError(true);
    setImageLoaded(false);
  };

  const renderImage = () => {
    if (imageError) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-emerald-100 dark:from-emerald-900/30 to-emerald-200 dark:to-emerald-800/30 flex items-center justify-center rounded-lg transition-colors duration-300">
          <span className="text-5xl">🌿</span>
        </div>
      );
    }

    const imageUrl = currentImageUrl || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia';

    return (
      <div className="relative w-full h-full">
        {/* Skeleton loader saat loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
        )}
        
        <img
          ref={imgRef}
          src={imageUrl}
          alt={product.nama_produk || t('Gambar produk', 'Product image')}
          className={`w-full h-full object-cover rounded-lg transition-all duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } hover:scale-105`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="eager"
        />
      </div>
    );
  };

  // List View
  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div 
          className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300" 
          onClick={handleCardClick}
        >
          <div className="flex gap-6">
            <div 
              className="relative rounded-xl overflow-hidden border-4 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-2 min-w-32 h-32 flex items-center justify-center flex-shrink-0 transition-colors duration-300"
              onClick={handleImageClick}
            >
              {renderImage()}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 transition-colors duration-300">
                {product.nama_produk || t('Nama produk tidak tersedia', 'Product name not available')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 text-sm transition-colors duration-300">
                {product.deskripsi || t('Deskripsi tidak tersedia', 'Description not available')}
              </p>
              
              <div className="flex items-center gap-4 mb-4">
                {product.categories && (
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full transition-colors duration-300">
                    <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium transition-colors duration-300">
                      {product.categories.name_kategori || product.categories.nama_kategori || t('Kategori', 'Category')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-left">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 transition-colors duration-300">
                    {formatPrice(product.harga)}
                  </div>
                  <div className={`text-sm font-medium transition-colors duration-300 ${
                    (product.stok || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {(product.stok || 0) > 0 
                      ? `${t('Stok', 'Stock')}: ${product.stok}` 
                      : t('Stok Habis', 'Out of Stock')
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 pb-6 pt-4 bg-white dark:bg-gray-800 transition-colors duration-300">
          <button 
            type="button"
            className="w-full bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            onClick={handleBuyClick}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {t('Lihat Detail & Beli', 'View Details & Buy')}
          </button>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div 
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300" 
        onClick={handleCardClick}
      >
        <div className="p-4">
          <div 
            className="relative rounded-xl overflow-hidden border-4 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-2 mb-4 h-48 flex items-center justify-center transition-colors duration-300"
            onClick={handleImageClick}
          >
            {renderImage()}
          </div>

          <div className="flex justify-between items-start mb-3">
            {product.categories && (
              <div className="bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full transition-colors duration-300">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium transition-colors duration-300">
                  {product.categories.name_kategori || product.categories.nama_kategori || t('Kategori', 'Category')}
                </span>
              </div>
            )}
          </div>

          <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm transition-colors duration-300">
            {product.nama_produk || t('Nama produk tidak tersedia', 'Product name not available')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-xs mb-3 line-clamp-2 transition-colors duration-300">
            {product.deskripsi || t('Deskripsi tidak tersedia', 'Description not available')}
          </p>

          <div className="flex justify-between items-center">
            <div className="text-left">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 transition-colors duration-300">
                {formatPrice(product.harga)}
              </div>
              <div className={`text-xs font-medium transition-colors duration-300 ${
                product.stok > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {product.stok > 0 
                  ? `${t('Stok', 'Stock')}: ${product.stok}` 
                  : t('Stok Habis', 'Out of Stock')
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 pb-4 pt-3 bg-white dark:bg-gray-800 transition-colors duration-300">
        <button 
          type="button"
          className="w-full bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          onClick={handleBuyClick}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {t('Beli Sekarang', 'Buy Now')}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;