// src/components/ProductCard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';

const ProductCard = ({ product, viewMode }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Error handling untuk product data
  if (!product) {
    console.error('❌ ProductCard: Product data is null or undefined');
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
        <p className="text-red-600 font-semibold">⚠️ Error: Product data missing</p>
      </div>
    );
  }

  if (!product.id) {
    console.error('❌ ProductCard: Product ID is missing', product);
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
        <p className="text-red-600 font-semibold">⚠️ Error: Product ID missing</p>
      </div>
    );
  }

  const handleCardClick = () => {
    try {
      console.log('🖱️ Card clicked, navigating to product:', product.id);
      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error('❌ Error navigating from card click:', error);
      toast.error('Gagal membuka detail produk');
    }
  };

  const handleImageClick = (e) => {
    try {
      e.stopPropagation();
      console.log('🖼️ Image clicked, navigating to product:', product.id);
      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error('❌ Error navigating from image click:', error);
      toast.error('Gagal membuka detail produk');
    }
  };

  // UBAH: Tombol beli sekarang langsung ke detail produk
  const handleBuyClick = (e) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation();
      }
      
      console.log('🛒 Buy button clicked, navigating to product:', product.id);
      // Navigasi ke halaman detail produk
      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error('❌ Error navigating from buy button:', error);
      toast.error('Gagal membuka detail produk');
    }
  };

  
  // Format harga ke Rupiah
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

  // HAPUS Skeleton loading - langsung tampilkan gambar atau placeholder
  const renderImage = () => {
    if (imageError) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center rounded-lg">
          <span className="text-5xl">🌿</span>
        </div>
      );
    }

    const imageUrl = product.gambar_url || product.gambar || '/api/placeholder/300/300';
    console.log('🖼️ Rendering image for product:', product.id, 'URL:', imageUrl);

    return (
      <img
        src={imageUrl}
        alt={product.nama_produk || 'Product image'}
        className="w-full h-full object-cover rounded-lg transition-all duration-300 hover:scale-105"
        onLoad={() => {
          console.log('✅ Image loaded successfully for product:', product.id);
          setImageLoaded(true);
        }}
        onError={(e) => {
          console.error('❌ Image failed to load for product:', product.id, 'URL:', imageUrl);
          setImageError(true);
        }}
        loading="lazy"
      />
    );
  };

  // List View
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        {/* Area utama yang bisa di-click untuk detail produk */}
        <div 
          className="p-6 cursor-pointer hover:bg-gray-50" 
          onClick={handleCardClick}
        >
          <div className="flex gap-6">
            {/* Container Gambar */}
            <div 
              className="relative rounded-xl overflow-hidden border-4 border-gray-200 bg-gray-50 p-2 min-w-32 h-32 flex items-center justify-center flex-shrink-0"
              onClick={handleImageClick}
            >
              {renderImage()}
            </div>

            {/* Konten Produk */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                {product.nama_produk || 'Nama produk tidak tersedia'}
              </h3>
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
                  <div className={`text-sm font-medium ${
                    (product.stok || 0) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(product.stok || 0) > 0 ? `Stok: ${product.stok}` : 'Stok Habis'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* TOMBOL BELI - Mengarah ke Detail Produk */}
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
      {/* Area yang bisa di-click untuk ke detail produk */}
      <div 
        className="cursor-pointer hover:bg-gray-50" 
        onClick={handleCardClick}
      >
        <div className="p-4">
          {/* Container Gambar */}
          <div 
            className="relative rounded-xl overflow-hidden border-4 border-gray-200 bg-gray-50 p-2 mb-4 h-48 flex items-center justify-center"
            onClick={handleImageClick}
          >
            {renderImage()}
          </div>

          {/* Badge Kategori */}
          <div className="flex justify-between items-start mb-3">
            {product.categories && (
              <div className="bg-emerald-100 px-3 py-1 rounded-full">
                <span className="text-xs text-emerald-700 font-medium">
                  {product.categories.name_kategori || product.categories.nama_kategori}
                </span>
              </div>
            )}
          </div>

          {/* Info Produk */}
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-sm">
            {product.nama_produk}
          </h3>
          <p className="text-gray-600 text-xs mb-3 line-clamp-2">
            {product.deskripsi}
          </p>

          <div className="flex justify-between items-center">
            <div className="text-left">
              <div className="text-lg font-bold text-emerald-600">
                {formatPrice(product.harga)}
              </div>
              <div className={`text-xs font-medium ${
                product.stok > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {product.stok > 0 ? `Stok: ${product.stok}` : 'Stok Habis'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* TOMBOL BELI - Mengarah ke Detail Produk */}
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