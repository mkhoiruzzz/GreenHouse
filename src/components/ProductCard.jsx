// src/components/ProductCard.jsx
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col"
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative w-full h-40 md:h-48 overflow-hidden flex-shrink-0">
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
      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-sm md:text-base text-gray-800 mb-1 md:mb-2 line-clamp-2 leading-tight">
          {product.nama_produk}
        </h3>
        <p className="text-gray-600 text-xs md:text-sm mb-2 md:mb-3 line-clamp-2 leading-relaxed">
          {product.deskripsi}
        </p>
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1 md:gap-0 mb-2">
          <span className="text-base md:text-lg font-bold text-secondary">
            Rp {product.harga?.toLocaleString('id-ID')}
          </span>
          <span className={`text-xs md:text-sm ${
            product.stok > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {product.stok > 0 ? `Stok: ${product.stok}` : 'Stok Habis'}
          </span>
        </div>

        {/* Category */}
        {product.categories && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0 mt-auto">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block w-fit">
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