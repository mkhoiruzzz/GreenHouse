import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';

const ProductCard = ({ product, viewMode }) => {
  const urlFromProduct = product?.gambar_url || product?.gambar || '';

  const [currentImageUrl, setCurrentImageUrl] = useState(urlFromProduct);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!urlFromProduct);

  const loadingTimeoutRef = useRef(null);

  const navigate = useNavigate();
  const { addToCart } = useCart();


  // Reset state when product changes
  useEffect(() => {
    const newImageUrl = product?.gambar_url || product?.gambar || '';

    // Always clear existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    if (!newImageUrl) {
      setImageLoaded(false);
      setImageError(true);
      setIsLoading(false);
      setCurrentImageUrl('');
      return;
    }

    if (newImageUrl !== currentImageUrl) {
      setImageLoaded(false);
      setImageError(false);
      setIsLoading(true);
      setCurrentImageUrl(newImageUrl);

      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        if (!imageLoaded && !imageError) {
          setImageLoaded(true);
        }
      }, 5000);
    } else if (isLoading) {
      // If URL is same but still loading (e.g. initial mount with URL), start timeout
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        if (!imageLoaded && !imageError) {
          setImageLoaded(true);
        }
      }, 5000);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [product?.id, product?.gambar_url, product?.gambar]);

  if (!product) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
        <p className="text-red-600 font-semibold">
          ⚠️ Data produk tidak tersedia
        </p>
      </div>
    );
  }

  if (!product.id) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
        <p className="text-red-600 font-semibold">
          ⚠️ ID produk tidak tersedia
        </p>
      </div>
    );
  }

  const handleCardClick = () => {
    try {
      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error('❌ Error navigating:', error);
      toast.error('Gagal membuka detail produk');
    }
  };

  const handleImageClick = (e) => {
    try {
      e.stopPropagation();
      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error('❌ Error navigating:', error);
      toast.error('Gagal membuka detail produk');
    }
  };

  const handleBuyClick = (e) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation();
      }

      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error('❌ Error navigating:', error);
      toast.error('Gagal membuka detail produk');
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
    setImageLoaded(true);
    setImageError(false);
    setIsLoading(false);

    // Clear timeout since image loaded successfully
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    setIsLoading(false);

    // Clear timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  };

  const renderImage = () => {
    if (imageError) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center rounded-lg">
          <span className="text-5xl">🌿</span>
        </div>
      );
    }

    const imageUrl = currentImageUrl || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia';

    return (
      <div className="relative w-full h-full">
        {/* ✅ SKELETON: Hanya tampil jika isLoading = true */}
        {isLoading && !imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-gray-500">Loading...</span>
            </div>
          </div>
        )}

        {/* ✅ IMAGE: Selalu render, tapi atur opacity */}
        <img
          src={imageUrl}
          alt={product.nama_produk || 'Gambar produk'}
          className={`w-full h-full object-cover rounded-lg transition-all duration-500 ${imageLoaded || !isLoading ? 'opacity-100' : 'opacity-0'
            } hover:scale-105`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="eager"
        />
      </div>
    );
  };

  // ... (sisa kode sama seperti sebelumnya - List View dan Grid View)

  // List View
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div
          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-300"
          onClick={handleCardClick}
        >
          <div className="flex gap-6">
            <div
              className="relative rounded-xl overflow-hidden border-4 border-gray-200 bg-gray-50 p-2 min-w-32 h-32 flex items-center justify-center flex-shrink-0"
              onClick={handleImageClick}
            >
              {renderImage()}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                {product.nama_produk || 'Nama produk tidak tersedia'}
              </h3>

              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/product/${product.id}#customer-reviews`);
                  }}
                  className="flex items-center gap-0.5 hover:bg-yellow-50 px-1 rounded transition-colors"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-sm ${star <= (product.avg_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                  <span className="text-xs text-emerald-600 font-medium ml-1">({product.total_reviews || 0})</span>
                </button>
                <div className="h-3 w-[1px] bg-gray-300"></div>
                <span className="text-xs text-gray-500">Terjual {product.total_sold || 0}</span>
              </div>
              <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
                {product.deskripsi || 'Deskripsi tidak tersedia'}
              </p>

              <div className="flex items-center gap-4 mb-4">
                {product.categories && (
                  <div className="bg-emerald-100 px-3 py-1 rounded-full">
                    <span className="text-sm text-emerald-700 font-medium">
                      {product.categories.name_kategori || product.categories.nama_kategori || 'Kategori'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-left">
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatPrice(product.harga)}
                  </div>
                  <div className={`text-sm font-medium ${(product.stok || 0) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {(product.stok || 0) > 0
                      ? `Stok: ${product.stok}`
                      : 'Stok Habis'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 pb-6 pt-4 bg-white">
          <button
            type="button"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            onClick={handleBuyClick}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Lihat Detail & Beli
          </button>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div
        className="cursor-pointer hover:bg-gray-50 transition-colors duration-300"
        onClick={handleCardClick}
      >
        <div className="p-4">
          <div
            className="relative rounded-xl overflow-hidden border-4 border-gray-200 bg-gray-50 p-2 mb-4 h-48 flex items-center justify-center"
            onClick={handleImageClick}
          >
            {renderImage()}
          </div>

          <div className="flex justify-between items-start mb-3">
            {product.categories && (
              <div className="bg-emerald-100 px-3 py-1 rounded-full">
                <span className="text-xs text-emerald-700 font-medium">
                  {product.categories.name_kategori || product.categories.nama_kategori || 'Kategori'}
                </span>
              </div>
            )}
          </div>

          <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm">
            {product.nama_produk || 'Nama produk tidak tersedia'}
          </h3>

          <div className="flex items-center justify-between mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product/${product.id}#customer-reviews`);
              }}
              className="flex items-center gap-0.5 hover:bg-yellow-50 px-0.5 rounded transition-colors"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`text-[10px] ${star <= (product.avg_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ★
                </span>
              ))}
              <span className="text-[10px] text-emerald-600 font-medium ml-1">({product.total_reviews || 0})</span>
            </button>
            <span className="text-[10px] text-gray-500">Terjual {product.total_sold || 0}</span>
          </div>
          <p className="text-gray-600 text-xs mb-3 line-clamp-2">
            {product.deskripsi || 'Deskripsi tidak tersedia'}
          </p>

          <div className="flex justify-between items-center">
            <div className="text-left">
              <div className="text-lg font-bold text-emerald-600">
                {formatPrice(product.harga)}
              </div>
              <div className={`text-xs font-medium ${product.stok > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                {product.stok > 0
                  ? `Stok: ${product.stok}`
                  : 'Stok Habis'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 pb-4 pt-3 bg-white">
        <button
          type="button"
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          onClick={handleBuyClick}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          Beli Sekarang
        </button>
      </div>
    </div>
  );
};

export default ProductCard;