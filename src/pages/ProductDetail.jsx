// src/pages/ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsService } from '../services/productsService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      fetchProductDetail();
    }
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching product detail with ID:', id);
      
      const productData = await productsService.getProductById(id);
      
      if (!productData) {
        throw new Error('Product not found');
      }
      
      setProduct(productData);
    } catch (error) {
      console.error('❌ Error fetching product:', error);
      toast.error('Gagal memuat detail produk');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      if (!product) {
        toast.error('Produk tidak tersedia');
        return;
      }
      
      if (quantity < 1) {
        toast.error('Quantity harus minimal 1');
        return;
      }
      
      if (quantity > product.stok) {
        toast.error(`Stok tidak mencukupi. Stok tersedia: ${product.stok}`);
        return;
      }
      
      await addToCart(product, quantity);
      toast.success(`${product.nama_produk} berhasil ditambahkan ke keranjang!`);
      
      setQuantity(1);
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      toast.error(error.message || 'Gagal menambahkan ke keranjang');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Produk tidak ditemukan</h2>
          <Link 
            to="/products"
            className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-secondary-dark"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 mt-16">
      <div className="max-w-7xl mx-auto px-3 md:px-4">
        {/* Navigation */}
        <Link 
          to="/products"
          className="mb-4 md:mb-6 text-secondary hover:underline flex items-center text-sm md:text-base"
        >
          ← Kembali ke Katalog
        </Link>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 p-4 md:p-8">
            {/* Product Image */}
            <div className="flex justify-center">
              <img 
                src={product.gambar_url || product.gambar} 
                alt={product.nama_produk}
                className="w-full max-w-md md:max-w-full h-64 md:h-96 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/600x400/4ade80/white?text=Gambar+Tidak+Tersedia';
                }}
              />
            </div>
            
            {/* Product Info */}
            <div className="flex flex-col justify-between space-y-4 md:space-y-6">
              <div className="space-y-3 md:space-y-4">
                <h1 className="text-xl md:text-3xl font-bold text-gray-900 leading-tight">
                  {product.nama_produk}
                </h1>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                  {product.deskripsi}
                </p>
                
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <span className="text-xl md:text-2xl font-bold text-secondary">
                    Rp {product.harga?.toLocaleString('id-ID')}
                  </span>
                  <span className={`text-sm ${product.stok > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stok > 0 ? `Stok: ${product.stok}` : 'Stok Habis'}
                  </span>
                </div>
                
                {product.categories && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Kategori:</span>
                    <span className="text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-sm">
                      {product.categories.name_kategori || product.categories.nama_kategori || 'Tanaman'}
                    </span>
                  </div>
                )}

                {product.durability && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Tingkat Perawatan:</span>
                    <span className="text-gray-700 capitalize text-sm">
                      {product.durability}
                    </span>
                  </div>
                )}

                {product.cara_perawatan && (
                  <div>
                    <span className="text-sm text-gray-500">Cara Perawatan:</span>
                    <p className="text-gray-700 mt-1 text-sm leading-relaxed">
                      {product.cara_perawatan}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Add to Cart */}
              <div className="border-t pt-4 md:pt-6">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-4">
                  <label className="text-gray-700 font-medium text-sm md:text-base">Jumlah:</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="1"
                      max={product.stok}
                      value={quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setQuantity(Math.max(1, Math.min(value, product.stok)));
                      }}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm md:text-base"
                    />
                    <span className="text-xs md:text-sm text-gray-500">
                      Maks: {product.stok}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={handleAddToCart}
                  disabled={product.stok === 0}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors text-sm md:text-base ${
                    product.stok === 0 
                      ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
                      : 'bg-secondary hover:bg-secondary-dark text-white'
                  }`}
                >
                  {product.stok === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;