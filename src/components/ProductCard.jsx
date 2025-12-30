import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';

const ProductCard = ({ product, viewMode = 'grid' }) => {
  const [imgSrc, setImgSrc] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const imgRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTheme();

  /* =========================
     IMAGE INITIALIZER (FINAL)
     ========================= */
  useEffect(() => {
    if (!product?.gambar_url) {
      setImgSrc('https://placehold.co/400x300/4ade80/white?text=No+Image');
      return;
    }

    // ✅ Cache-buster fix (Supabase + Incognito safe)
    const safeUrl = `${product.gambar_url}?v=${product.updated_at || product.id}`;

    setLoaded(false);
    setError(false);
    setImgSrc(safeUrl);
  }, [product?.gambar_url, product?.updated_at, product?.id]);

  const handleImageLoad = () => setLoaded(true);
  const handleImageError = () => {
    setError(true);
    setLoaded(true);
    setImgSrc('https://placehold.co/400x300/4ade80/white?text=No+Image');
  };

  const goDetail = () => navigate(`/product/${product.id}`);

  /* =========================
     IMAGE RENDER (FINAL)
     ========================= */
  const ImageBox = (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
      )}

      <img
        ref={imgRef}
        src={imgSrc}
        alt={product.nama_produk}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );

  /* =========================
     GRID VIEW (DEFAULT)
     ========================= */
  return (
    <div
      onClick={goDetail}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
    >
      <div className="p-4">
        <div className="h-48 border-4 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-4">
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
