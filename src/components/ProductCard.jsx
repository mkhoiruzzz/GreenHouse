import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const ProductCard = ({ product, viewMode = 'grid' }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const imgRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTheme();
  const prevImgUrlRef = useRef('');

  // ✅ FIX: Gunakan useMemo untuk URL yang stable, update jika product.id atau gambar_url berubah
  const imgUrl = useMemo(() => {
    if (!product?.gambar_url) {
      return 'https://placehold.co/400x300/4ade80/white?text=No+Image';
    }
    // ✅ Gunakan URL asli tanpa cache buster yang berubah-ubah
    return product.gambar_url;
  }, [product?.id, product?.gambar_url]);

  // ✅ Reset loading state hanya saat URL gambar benar-benar berubah
  useEffect(() => {
    const currentUrl = imgUrl;
    // Hanya reset jika URL benar-benar berubah (setelah login/refresh)
    if (prevImgUrlRef.current !== currentUrl) {
      prevImgUrlRef.current = currentUrl;
      setLoaded(false);
      setError(false);
    }
  }, [imgUrl]);

  // ✅ Check if image is already cached after URL changes
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalHeight !== 0 && !loaded) {
      setLoaded(true);
      setError(false);
    }
  }, [imgUrl, loaded]);

  const handleImageLoad = () => {
    // ✅ Set loaded state
    setLoaded(true);
    setError(false);
  };

  const handleImageError = () => {
    // ✅ Set error state - error indicator akan ditampilkan
    setError(true);
    setLoaded(true);
  };

  const goDetail = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      onClick={goDetail}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
    >
      <div className="p-4">
        {/* Image container */}
        <div className="relative h-48 border-4 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-4 overflow-hidden">
          
          {/* Loading skeleton - tampil saat image belum loaded */}
          {!loaded && !error && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg z-10" />
          )}

          {/* Image element - selalu render untuk memicu onLoad */}
          <img
            key={product?.id}
            ref={imgRef}
            src={imgUrl}
            alt={product?.nama_produk || 'Product'}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
              loaded && !error ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              display: 'block',
              width: '100%',
              height: '100%'
            }}
            loading="lazy"
            decoding="async"
          />

          {/* Error indicator */}
          {error && loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-400 text-xs mb-1">⚠️</span>
              <span className="text-gray-400 text-xs">Gambar tidak tersedia</span>
            </div>
          )}
        </div>

        {/* Category badge */}
        {product?.categories && (
          <span className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1 rounded-full mb-2">
            {product.categories.nama_kategori || product.categories.name_kategori || 'Tanaman'}
          </span>
        )}

        {/* Product name */}
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