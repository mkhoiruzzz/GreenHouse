// src/components/ProductCard.jsx
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Navigasi ke halaman detail produk
    navigate(`/product/${product.id}`);
  };

  const handleImageClick = (e) => {
    e.stopPropagation(); // Mencegah event bubbling ke card
    navigate(`/product/${product.id}`);
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={product.gambar_url || product.gambar} 
          alt={product.nama_produk}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onClick={handleImageClick}
          onError={(e) => {
            e.target.src = 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia';
            e.target.onerror = null;
          }}
        />
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">
          {product.nama_produk}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.deskripsi}
        </p>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-bold text-secondary">
            Rp {product.harga?.toLocaleString('id-ID')}
          </span>
          <span className={`text-sm ${
            product.stok > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {product.stok > 0 ? `Stok: ${product.stok}` : 'Stok Habis'}
          </span>
        </div>

        {/* Category */}
        {product.categories && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {product.categories.name_kategori || product.categories.nama_kategori}
            </span>
            {product.durability && (
              <span className="text-xs text-gray-500 capitalize">
                {product.durability}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;