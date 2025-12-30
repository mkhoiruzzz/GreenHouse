import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';

const ProductCard = ({ product, viewMode = 'grid' }) => {
  const [imgSrc, setImgSrc] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const imgRef = useRef(null);
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTheme();

  /* =========================
     INTERSECTION OBSERVER (untuk lazy loading)
     ========================= */
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect(); // Stop observing setelah terlihat
          }
        });
      },
      {
        rootMargin: '50px', // Load sedikit sebelum masuk viewport
        threshold: 0.01
      }
    );

    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, []);

  /* =========================
     IMAGE INITIALIZER
     ========================= */
  useEffect(() => {
    // Tunggu sampai card terlihat atau langsung load jika tidak ada observer support
    if (!isInView && 'IntersectionObserver' in window) return;

    if (!product?.gambar_url) {
      setImgSrc('https://placehold.co/400x300/4ade80/white?text=No+Image');
      setLoaded(true);
      return;
    }

    // ✅ PERBAIKAN: Tambahkan timestamp untuk force reload di incognito
    const timestamp = Date.now();
    const cacheKey = product.updated_at || product.id || timestamp;
    
    // ✅ Gunakan kombinasi cache-buster yang lebih kuat
    const safeUrl = `${product.gambar_url}?v=${cacheKey}&t=${timestamp}`;

    setLoaded(false);
    setError(false);
    setImgSrc(safeUrl);

    // ✅ PERBAIKAN: Preload image untuk memastikan loading
    const img = new Image();
    img.src = safeUrl;
    
    img.onload = () => {
      setLoaded(true);
    };
    
    img.onerror = () => {
      handleImageError();
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [product?.gambar_url, product?.updated_at, product?.id, isInView]);

  const handleImageLoad = () => {
    setLoaded(true);
    setError(false);
  };

  const handleImageError = () => {
    console.error('Image failed to load:', imgSrc);
    setError(true);
    setLoaded(true);
    setImgSrc('https://placehold.co/400x300/4ade80/white?text=No+Image');
  };

  const goDetail = () => navigate(`/product/${product.id}`);

  /* =========================
     IMAGE RENDER
     ========================= */
  const ImageBox = (
    <div className="relative w-full h-full">
      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
      )}

      {/* Actual image - hanya render jika sudah ada src */}
      {imgSrc && (
        <img
          ref={imgRef}
          src={imgSrc}
          alt={product.nama_produk}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
          className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            // ✅ Force browser to always fetch fresh image
            imageRendering: 'auto'
          }}
        />
      )}

      {/* Error state indicator */}
      {error && loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <span className="text-gray-400 text-xs">⚠️ Gambar gagal dimuat</span>
        </div>
      )}
    </div>
  );

  /* =========================
     GRID VIEW (DEFAULT)
     ========================= */
  return (
    <div
      ref={cardRef}
      onClick={goDetail}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
    >
      <div className="p-4">
        {/* Image container with fixed aspect ratio */}
        <div className="h-48 border-4 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-4 overflow-hidden">
          {ImageBox}
        </div>

        {product.categories && (
          <span className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1 rounded-full mb-2">
            {product.categories.nama_kategori || 'Tanaman'}
          </span>
        )}

        <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
          {product.nama_produk}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 text-xs line-clamp-2 mb-2">
          {product.deskripsi}
        </p>

        <div className="font-bold text-emerald-600 dark:text-emerald-400">
          Rp {Number(product.harga).toLocaleString('id-ID')}
        </div>

        <div
          className={`text-xs font-medium ${
            product.stok > 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {product.stok > 0 ? `Stok: ${product.stok}` : 'Stok Habis'}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;