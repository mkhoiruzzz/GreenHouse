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

  // ✅ PERBAIKAN 1: Tambahkan FALLBACK images yang lebih banyak
  const FALLBACK_IMAGES = [
    'https://placehold.co/400x300/4ade80/white?text=Green+House',
    'https://placehold.co/400x300/22c55e/white?text=Tanaman+Hias',
    'https://placehold.co/400x300/10b981/white?text=No+Image',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=300&fit=crop'
  ];

  const getRandomFallback = () => {
    const index = product?.id 
      ? parseInt(product.id.toString().slice(-1)) % FALLBACK_IMAGES.length
      : Math.floor(Math.random() * FALLBACK_IMAGES.length);
    return FALLBACK_IMAGES[index];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ PERBAIKAN 2: Preload image dengan timeout
  useEffect(() => {
    // Reset states
    setIsLoading(true);
    setHasError(false);

    // Jika tidak ada gambar, langsung gunakan fallback
    if (!product?.gambar_url || 
        product.gambar_url === 'null' || 
        product.gambar_url === 'undefined' ||
        product.gambar_url === '' ||
        !product.gambar_url.startsWith('http')) {
      
      console.log(`⚠️ No valid image URL for product: ${product?.nama_produk}`);
      const fallback = getRandomFallback();
      
      if (isMountedRef.current) {
        setDisplaySrc(fallback);
        setIsLoading(false);
        setHasError(true); // Tandai sebagai error untuk styling
      }
      return;
    }

    // ✅ PERBAIKAN 3: Tambahkan timeout untuk mencegah loading forever
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current && isLoading) {
        console.warn(`⏰ Timeout loading image: ${product.gambar_url}`);
        setDisplaySrc(getRandomFallback());
        setIsLoading(false);
        setHasError(true);
      }
    }, 5000); // 5 detik timeout

    // Preload image
    const img = new Image();
    const imageUrl = product.gambar_url;

    img.onload = () => {
      clearTimeout(timeoutId);
      if (isMountedRef.current) {
        console.log(`✅ Image loaded successfully: ${product.nama_produk}`);
        setDisplaySrc(imageUrl);
        setIsLoading(false);
        setHasError(false);
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      if (isMountedRef.current) {
        console.warn(`❌ Failed to load image: ${product.nama_produk}`);
        setDisplaySrc(getRandomFallback());
        setIsLoading(false);
        setHasError(true);
      }
    };

    // Trigger load
    img.src = imageUrl;

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
  }, [product?.gambar_url, product?.nama_produk, product?.id]);

  const goDetail = () => {
    navigate(`/product/${product.id}`);
  };

  // ✅ PERBAIKAN 4: Tambahkan class kondisional untuk error state
  const getContainerClasses = () => {
    const baseClasses = "bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300";
    
    if (hasError) {
      return `${baseClasses} opacity-90`;
    }
    
    return baseClasses;
  };

  // ✅ PERBAIKAN 5: Sederhanakan render image
  const renderImage = () => {
    // Loading state
    if (isLoading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
          <div className="absolute flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500 mb-2"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Memuat gambar...</span>
          </div>
        </div>
      );
    }

    // Error state - show fallback with icon
    if (hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="text-4xl mb-2">🌿</div>
          <div className="text-center px-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Gambar tanaman</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Gambar asli tidak tersedia</p>
          </div>
        </div>
      );
    }

    // Success state - show actual image
    return (
      <img
        ref={imgRef}
        src={displaySrc}
        alt={product?.nama_produk || 'Product'}
        className="w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: 1 }}
        onError={(e) => {
          // Additional safety net
          console.warn('img onError triggered');
          e.target.src = getRandomFallback();
          setHasError(true);
        }}
      />
    );
  };

  return (
    <div
      onClick={goDetail}
      className={getContainerClasses()}
      style={{
        minHeight: viewMode === 'grid' ? '320px' : 'auto'
      }}
    >
      <div className="p-4">
        {/* Image Container */}
        <div className="relative h-48 border-4 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 overflow-hidden mb-4">
          {renderImage()}

          {/* Loading/Error Badge */}
          {(isLoading || hasError) && (
            <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full ${
              isLoading 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            }`}>
              {isLoading ? '🔄' : '⚠️'}
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

        {/* ✅ PERBAIKAN 6: Debug info (hapus di production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
            <div className="text-[10px] text-gray-400 flex justify-between">
              <span>Status: {isLoading ? 'Loading' : hasError ? 'Error' : 'Loaded'}</span>
              <span>ID: {product?.id}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;