// src/components/ProductCard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product, viewMode }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  const handleBuyClick = (e) => {
    e.stopPropagation();
    // Fungsi beli produk - bisa ditambahkan logic sesuai kebutuhan
    console.log('Beli produk:', product.id);
  };

  // Fungsi untuk mendapatkan konfigurasi bingkai berdasarkan durability
  const getFrameConfig = (durability) => {
    const configs = {
      hard: {
        gradient: 'from-green-500 to-green-600',
        bgGradient: 'from-green-50 to-green-100',
        borderColor: 'border-green-300',
        icon: '🚀',
        text: ' Kirim Seluruh Indonesia',
        textColor: 'text-green-700',
        bgOpacity: 'bg-green-500/10'
      },
      medium: {
        gradient: 'from-blue-500 to-blue-600', 
        bgGradient: 'from-blue-50 to-blue-100',
        borderColor: 'border-blue-300',
        icon: '📍',
        text: ' KIRIM JAWA TIMUR',
        textColor: 'text-blue-700',
        bgOpacity: 'bg-blue-500/10'
      },
      easy: {
        gradient: 'from-red-500 to-red-600',
        bgGradient: 'from-red-50 to-red-100',
        borderColor: 'border-red-300',
        icon: '🚫',
        text: 'HANYA SURABAYA',
        textColor: 'text-red-700',
        bgOpacity: 'bg-red-500/10'
      }
    };
    
    return configs[durability] || configs.medium; // default ke medium
  };

  const frameConfig = getFrameConfig(product.durability);

  // Format harga ke Rupiah
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Skeleton loading untuk gambar
  const ImageSkeleton = () => (
    <div className="w-full h-48 bg-gray-300 animate-pulse rounded-lg flex items-center justify-center">
      <span className="text-gray-400 text-2xl">🌱</span>
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div 
        className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Bingkai Header untuk List View */}
        <div className={`bg-gradient-to-r ${frameConfig.gradient} p-3 text-white text-center`}>
          <div className="flex items-center justify-center gap-2 text-sm font-bold">
            <span>{frameConfig.icon}</span>
            <span>{frameConfig.text}</span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex gap-6">
            {/* Container Gambar dengan Bingkai */}
            <div 
              className={`relative rounded-xl overflow-hidden border-4 ${frameConfig.borderColor} ${frameConfig.bgOpacity} p-2 min-w-32 h-32 flex items-center justify-center cursor-pointer`}
              onClick={handleImageClick}
            >
              {!imageLoaded && !imageError && <ImageSkeleton />}
              {imageError ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
                  <span className="text-3xl text-gray-400">🌿</span>
                </div>
              ) : (
                <img
                  src={product.gambar_url || product.gambar || '/api/placeholder/300/300'}
                  alt={product.nama_produk}
                  className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              )}
            </div>

            {/* Konten Produk */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                {product.nama_produk}
              </h3>
              <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
                {product.deskripsi}
              </p>
              
              <div className="flex items-center gap-4 mb-4">
                <div className={`px-3 py-1 rounded-full ${frameConfig.bgOpacity} border ${frameConfig.borderColor}`}>
                  <span className={`text-sm font-semibold ${frameConfig.textColor}`}>
                    {frameConfig.icon} {product.durability === 'hard' ? 'Tahan Lama' : 
                     product.durability === 'medium' ? 'Tahan Sedang' : 'Mudah Mati'}
                  </span>
                </div>
                
                {product.categories && (
                  <div className="bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-sm text-gray-700 font-medium">
                      {product.categories.name_kategori || product.categories.nama_kategori}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-left">
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatPrice(product.harga)}
                  </div>
                  <div className={`text-sm ${
                    product.stok > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {product.stok > 0 ? `Stok: ${product.stok}` : 'Stok Habis'}
                  </div>
                </div>
                <button 
                  className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  onClick={handleBuyClick}
                >
                  Beli Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div 
      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Bingkai Header untuk Grid View */}
      <div className={`bg-gradient-to-r ${frameConfig.gradient} p-2 text-white text-center`}>
        <div className="flex items-center justify-center gap-1 text-xs font-bold">
          <span>{frameConfig.icon}</span>
          <span className="truncate">{frameConfig.text}</span>
        </div>
      </div>

      <div className="p-4">
        {/* Container Gambar dengan Bingkai */}
        <div 
          className={`relative rounded-xl overflow-hidden border-4 ${frameConfig.borderColor} ${frameConfig.bgOpacity} p-2 mb-4 cursor-pointer`}
          onClick={handleImageClick}
        >
          {!imageLoaded && !imageError && <ImageSkeleton />}
          {imageError ? (
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg">
              <span className="text-4xl text-gray-400">🌿</span>
            </div>
          ) : (
            <img
              src={product.gambar_url || product.gambar || '/api/placeholder/300/300'}
              alt={product.nama_produk}
              className={`w-full h-48 object-cover rounded-lg transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Badge Durability */}
        <div className="flex justify-between items-start mb-3">
          <div className={`px-2 py-1 rounded-full ${frameConfig.bgOpacity} border ${frameConfig.borderColor}`}>
            <span className={`text-xs font-semibold ${frameConfig.textColor}`}>
              {frameConfig.icon} {product.durability === 'hard' ? 'Tahan Lama' : 
               product.durability === 'medium' ? 'Tahan Sedang' : 'Mudah Mati'}
            </span>
          </div>
          
          {product.categories && (
            <div className="bg-gray-100 px-2 py-1 rounded-full">
              <span className="text-xs text-gray-700 font-medium">
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
            <div className={`text-xs ${
              product.stok > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {product.stok > 0 ? `Stok: ${product.stok}` : 'Stok Habis'}
            </div>
          </div>
          <button 
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-all duration-200 text-sm shadow-md hover:shadow-lg"
            onClick={handleBuyClick}
          >
            Beli
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;