import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const [imageStatus, setImageStatus] = useState('loading');
  const [currentImage, setCurrentImage] = useState('');
  const navigate = useNavigate();

  // ✅ FALLBACK IMAGES JIKA GAMBAR UTAMA GAGAL
  const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=300&fit=crop'
  ];

  // ✅ DAPATKAN SUMBER GAMBAR YANG BENAR
  useEffect(() => {
    if (!product?.gambar_url) {
      // Jika tidak ada gambar, langsung ke fallback
      const fallbackIndex = Math.floor(Math.random() * FALLBACK_IMAGES.length);
      setCurrentImage(FALLBACK_IMAGES[fallbackIndex]);
      setImageStatus('loaded'); // Langsung loaded karena gambar pasti ada
      return;
    }

    // Pastikan URL gambar lengkap
    let imageUrl = product.gambar_url;
    
    // Jika URL relative, tambahkan domain Supabase
    if (imageUrl.startsWith('/')) {
      imageUrl = `https://ycwcbxbytdtmluzalofn.supabase.co${imageUrl}`;
    }
    
    // Jika URL storage Supabase, pastikan format benar
    if (imageUrl.includes('supabase.co/storage')) {
      // URL sudah benar, biarkan saja
      console.log(`🖼️ Loading Supabase image: ${imageUrl}`);
    }

    setCurrentImage(imageUrl);
    setImageStatus('loading');

    // Preload gambar dengan timeout
    const img = new Image();
    let timeoutId;

    img.onload = () => {
      clearTimeout(timeoutId);
      console.log(`✅ Image loaded: ${product.nama_produk}`);
      setImageStatus('loaded');
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      console.warn(`❌ Failed to load: ${imageUrl}`);
      
      // Coba fallback
      const fallbackIndex = product?.id 
        ? parseInt(product.id.toString().slice(-1)) % FALLBACK_IMAGES.length
        : 0;
      setCurrentImage(FALLBACK_IMAGES[fallbackIndex]);
      setImageStatus('loaded'); // Fallback pasti bisa di-load
    };

    // Timeout setelah 8 detik
    timeoutId = setTimeout(() => {
      console.warn(`⏰ Timeout loading: ${product.nama_produk}`);
      img.onload = null;
      img.onerror = null;
      
      const fallbackIndex = product?.id 
        ? parseInt(product.id.toString().slice(-1)) % FALLBACK_IMAGES.length
        : 0;
      setCurrentImage(FALLBACK_IMAGES[fallbackIndex]);
      setImageStatus('loaded');
    }, 8000);

    img.src = imageUrl;

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
  }, [product?.gambar_url, product?.id, product?.nama_produk]);

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  // ✅ RENDER BERDASARKAN STATUS
  const renderImage = () => {
    if (imageStatus === 'loading') {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
          <div className="absolute flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
            <span className="text-xs text-gray-500">Loading gambar...</span>
          </div>
        </div>
      );
    }

    // Gambar berhasil di-load
    return (
      <img
        src={currentImage}
        alt={product?.nama_produk || 'Tanaman Hias'}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          // Safety net: jika gambar error saat render
          console.error('❌ img onError triggered:', e.target.src);
          const fallbackIndex = Math.floor(Math.random() * FALLBACK_IMAGES.length);
          e.target.src = FALLBACK_IMAGES[fallbackIndex];
        }}
      />
    );
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="p-4">
        {/* Image Container */}
        <div className="relative h-48 border-4 border-gray-200 rounded-xl bg-gray-50 overflow-hidden mb-4">
          {renderImage()}
          
          {/* Loading Indicator */}
          {imageStatus === 'loading' && (
            <div className="absolute top-2 right-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
              🔄
            </div>
          )}
          
          {/* Fallback Indicator */}
          {imageStatus === 'loaded' && currentImage.includes('unsplash') && (
            <div className="absolute top-2 right-2 bg-amber-100 text-amber-600 text-xs px-2 py-1 rounded-full">
              ⚠️ Fallback
            </div>
          )}
        </div>

        {/* Product Info */}
        {product?.categories?.name_kategori && (
          <span className="inline-block bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full mb-2">
            {product.categories.name_kategori}
          </span>
        )}

        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">
          {product?.nama_produk || 'Tanaman Hias'}
        </h3>

        <p className="text-gray-600 text-xs line-clamp-2 mb-2">
          {product?.deskripsi || 'Deskripsi produk tanaman hias'}
        </p>

        <div className="font-bold text-emerald-600 mb-1">
          Rp {Number(product?.harga || 0).toLocaleString('id-ID')}
        </div>

        <div className={`text-xs font-medium ${
          (product?.stok || 0) > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {(product?.stok || 0) > 0 ? `Stok: ${product.stok}` : 'Stok Habis'}
        </div>
        
        {/* Debug Info (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 pt-2 border-t border-dashed border-gray-200 text-[10px] text-gray-400">
            <div className="flex justify-between">
              <span>Status: {imageStatus}</span>
              <span>ID: {product?.id}</span>
            </div>
            <div className="truncate" title={currentImage}>
              Img: {currentImage.substring(0, 40)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;