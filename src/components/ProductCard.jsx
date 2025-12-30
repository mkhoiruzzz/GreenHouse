import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const ProductCard = ({ product, viewMode = 'grid' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [displaySrc, setDisplaySrc] = useState('');
  
  const imgRef = useRef(null);
  const isMountedRef = useRef(true);
  const navigate = useNavigate();
  const { t } = useTheme();

  const PLACEHOLDER = 'https://placehold.co/400x300/4ade80/white?text=No+Image';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ SOLUSI: Preload image dengan proper error handling
  useEffect(() => {
    // Reset states
    setIsLoading(true);
    setHasError(false);

    // Jika tidak ada gambar, gunakan placeholder
    if (!product?.gambar_url) {
      setDisplaySrc(PLACEHOLDER);
      setIsLoading(false);
      return;
    }

    // Preload image
    const img = new Image();
    const imageUrl = product.gambar_url;

    img.onload = () => {
      if (isMountedRef.current) {
        setDisplaySrc(imageUrl);
        setIsLoading(false);
        setHasError(false);
      }
    };

    img.onerror = () => {
      if (isMountedRef.current) {
        console.warn('Failed to load image:', product.nama_produk);
        setDisplaySrc(PLACEHOLDER);
        setIsLoading(false);
        setHasError(true);
      }
    };

    // Trigger load
    img.src = imageUrl;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [product?.gambar_url, product?.nama_produk]);

  const goDetail = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      onClick={goDetail}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
    >
      <div className="p-4">
        {/* Image Container */}
        <div className="relative h-48 border-4 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 overflow-hidden mb-4">
          
          {/* Loading Skeleton */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 animate-pulse" />
              <div className="absolute">
                <svg className="animate-spin h-10 w-10 text-emerald-600 dark:text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          )}

          {/* Actual Image - Only render when ready */}
          {!isLoading && displaySrc && (
            <img
              ref={imgRef}
              src={displaySrc}
              alt={product?.nama_produk || 'Product'}
              className="w-full h-full object-cover"
              style={{ 
                opacity: 1,
                transition: 'opacity 0.3s ease-in-out'
              }}
            />
          )}

          {/* Error Indicator */}
          {hasError && !isLoading && (
            <div className="absolute top-2 right-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded-full">
              ⚠️
            </div>
          )}
        </div>

        {/* Category Badge */}
        {product?.categories && (
          <span className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1 rounded-full mb-2">
            {product.categories.nama_kategori || product.categories.name_kategori || 'Tanaman'}
          </span>
        )}

        {/* Product Name */}
        <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
          {product?.nama_produk || 'Nama Produk'}
        </h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-xs line-clamp-2 mb-2">
          {product?.deskripsi || 'Deskripsi produk'}
        </p>

        {/* Price */}
        <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">
          Rp {Number(product?.harga || 0).toLocaleString('id-ID')}
        </div>

        {/* Stock */}
        <div
          className={`text-xs font-medium ${
            (product?.stok || 0) > 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {(product?.stok || 0) > 0 ? `Stok: ${product.stok}` : 'Stok Habis'}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;