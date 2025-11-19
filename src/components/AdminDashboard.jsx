// components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Form data untuk produk baru
  const [newProduct, setNewProduct] = useState({
    nama_produk: '',
    deskripsi: '',
    deskripsi_lengkap: '',
    harga: '',
    stok: '',
    gambar_url: '',
    kategori_id: '',
    durability: 'medium',
    tingkat_kesulitan: 'Mudah',
    max_pengiriman_hari: '3',
    cara_perawatan: '',
    icon: '🌿'
  });

  // Form data untuk edit produk
  const [editProduct, setEditProduct] = useState(null);

  // Redirect jika bukan admin
  useEffect(() => {
    if (!isAdmin) {
      toast.error('Akses ditolak. Hanya admin yang dapat mengakses halaman ini.');
      window.location.href = '/';
    }
  }, [isAdmin]);

  // Fetch data products dari Supabase
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name_kategori)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('✅ Products fetched:', data?.length, 'items');
      setProducts(data || []);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      toast.error('Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories dari Supabase
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name_kategori');

      if (error) throw error;
      
      console.log('✅ Categories fetched:', data?.length, 'items');
      setCategories(data || []);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      toast.error('Gagal memuat data kategori');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchCategories();
    }
  }, [isAdmin]);

  // 🔥 FUNGSI UPLOAD GAMBAR KE SUPABASE STORAGE
  const handleImageUpload = async (event, isEdit = false) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Pilih gambar terlebih dahulu.');
      }

      const file = event.target.files[0];
      
      // Validasi file
      if (!file.type.startsWith('image/')) {
        throw new Error('File harus berupa gambar.');
      }
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Ukuran gambar maksimal 5MB.');
      }

      // Preview gambar
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName; // Hapus 'products/' prefix karena sudah ada di bucket name

      console.log('📤 Uploading image:', filePath);

      // Upload ke Supabase Storage dengan upsert: true untuk overwrite jika ada
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error detail:', uploadError);
        throw new Error(`Upload gagal: ${uploadError.message}. Pastikan RLS policy storage sudah diset dengan benar.`);
      }

      // Dapatkan URL public
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      console.log('✅ Image uploaded:', publicUrl);

      // Update form dengan URL gambar
      if (isEdit) {
        setEditProduct(prev => ({
          ...prev,
          gambar_url: publicUrl
        }));
      } else {
        setNewProduct(prev => ({
          ...prev,
          gambar_url: publicUrl
        }));
      }

      toast.success('Gambar berhasil diupload!');

    } catch (error) {
      console.error('❌ Error uploading image:', error);
      toast.error(`Gagal upload gambar: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 🔥 FUNGSI TAMBAH PRODUK
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validasi form
      if (!newProduct.nama_produk || !newProduct.harga || !newProduct.stok || !newProduct.kategori_id) {
        toast.error('Nama produk, harga, stok, dan kategori wajib diisi');
        return;
      }

      if (!newProduct.gambar_url) {
        toast.error('Silakan upload gambar produk');
        return;
      }

      console.log('📄 Adding product:', newProduct);

      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...newProduct,
          harga: parseFloat(newProduct.harga),
          stok: parseInt(newProduct.stok),
          max_pengiriman_hari: parseInt(newProduct.max_pengiriman_hari)
        }])
        .select();

      if (error) throw error;

      console.log('✅ Product added successfully:', data);

      toast.success('Produk berhasil ditambahkan!');
      
      // Reset form
      setShowAddProduct(false);
      setImagePreview(null);
      setNewProduct({
        nama_produk: '',
        deskripsi: '',
        deskripsi_lengkap: '',
        harga: '',
        stok: '',
        gambar_url: '',
        kategori_id: '',
        durability: 'medium',
        tingkat_kesulitan: 'Mudah',
        max_pengiriman_hari: '3',
        cara_perawatan: '',
        icon: '🌿'
      });
      
      fetchProducts();
    } catch (error) {
      console.error('💥 Error adding product:', error);
      toast.error(`Gagal menambahkan produk: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FUNGSI EDIT PRODUK
  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validasi form
      if (!editProduct.nama_produk || !editProduct.harga || !editProduct.stok || !editProduct.kategori_id) {
        toast.error('Nama produk, harga, stok, dan kategori wajib diisi');
        return;
      }

      console.log('📝 Updating product:', editProduct);

      const { data, error } = await supabase
        .from('products')
        .update({
          nama_produk: editProduct.nama_produk,
          deskripsi: editProduct.deskripsi,
          deskripsi_lengkap: editProduct.deskripsi_lengkap,
          harga: parseFloat(editProduct.harga),
          stok: parseInt(editProduct.stok),
          gambar_url: editProduct.gambar_url,
          kategori_id: editProduct.kategori_id,
          durability: editProduct.durability,
          tingkat_kesulitan: editProduct.tingkat_kesulitan,
          max_pengiriman_hari: parseInt(editProduct.max_pengiriman_hari),
          cara_perawatan: editProduct.cara_perawatan,
          icon: editProduct.icon
        })
        .eq('id', editProduct.id)
        .select();

      if (error) throw error;

      console.log('✅ Product updated successfully:', data);

      toast.success('Produk berhasil diperbarui!');
      
      // Reset form
      setShowEditProduct(false);
      setEditProduct(null);
      setImagePreview(null);
      
      fetchProducts();
    } catch (error) {
      console.error('💥 Error updating product:', error);
      toast.error(`Gagal memperbarui produk: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FUNGSI OPEN EDIT MODAL
  const openEditModal = (product) => {
    // Close add form first
    setShowAddProduct(false);
    
    setEditProduct({
      id: product.id,
      nama_produk: product.nama_produk,
      deskripsi: product.deskripsi,
      deskripsi_lengkap: product.deskripsi_lengkap || '',
      harga: product.harga.toString(),
      stok: product.stok.toString(),
      gambar_url: product.gambar_url,
      kategori_id: product.kategori_id,
      durability: product.durability || 'medium',
      tingkat_kesulitan: product.tingkat_kesulitan || 'Mudah',
      max_pengiriman_hari: product.max_pengiriman_hari?.toString() || '3',
      cara_perawatan: product.cara_perawatan || '',
      icon: product.icon || '🌿'
    });
    setImagePreview(product.gambar_url);
    setShowEditProduct(true);
  };

  // Reset add form function
  const resetAddForm = () => {
    setShowAddProduct(false);
    setImagePreview(null);
    setNewProduct({
      nama_produk: '',
      deskripsi: '',
      deskripsi_lengkap: '',
      harga: '',
      stok: '',
      gambar_url: '',
      kategori_id: '',
      durability: 'medium',
      tingkat_kesulitan: 'Mudah',
      max_pengiriman_hari: '3',
      cara_perawatan: '',
      icon: '🌿'
    });
  };

  // Reset edit form function
  const resetEditForm = () => {
    setShowEditProduct(false);
    setEditProduct(null);
    setImagePreview(null);
  };

  // 🔥 FUNGSI HAPUS PRODUK
  const handleDeleteProduct = async (productId, imageUrl) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      return;
    }

    try {
      // Hapus gambar dari storage jika ada
      if (imageUrl) {
        try {
          const imagePath = imageUrl.split('/').pop();
          await supabase.storage
            .from('products')
            .remove([`products/${imagePath}`]);
        } catch (storageError) {
          console.warn('⚠️ Gagal hapus gambar dari storage:', storageError);
        }
      }

      // Hapus produk dari database
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast.success('Produk berhasil dihapus!');
      fetchProducts();
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      toast.error('Gagal menghapus produk');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || product.kategori_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Stats calculation
  const stats = {
    totalProducts: products.length,
    totalStock: products.reduce((acc, p) => acc + (p.stok || 0), 0),
    lowStock: products.filter(p => p.stok <= 5).length,
    categories: categories.length
  };

  // Product Form Component (reusable for Add/Edit)
  const ProductForm = ({ product, setProduct, onSubmit, onCancel, isEdit = false }) => (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom Kiri */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={product.nama_produk}
              onChange={(e) => setProduct({...product, nama_produk: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="Contoh: Philodendron Birkin"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Harga (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={product.harga}
                onChange={(e) => setProduct({...product, harga: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="100000"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stok <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={product.stok}
                onChange={(e) => setProduct({...product, stok: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="10"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              value={product.kategori_id}
              onChange={(e) => setProduct({...product, kategori_id: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              required
            >
              <option value="">Pilih Kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_kategori}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tingkat Kesulitan
              </label>
              <select
                value={product.tingkat_kesulitan}
                onChange={(e) => setProduct({...product, tingkat_kesulitan: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              >
                <option value="Mudah">🟢 Mudah</option>
                <option value="Sedang">🟡 Sedang</option>
                <option value="Sulit">🔴 Sulit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Max Pengiriman (Hari)
              </label>
              <input
                type="number"
                value={product.max_pengiriman_hari}
                onChange={(e) => setProduct({...product, max_pengiriman_hari: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="3"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Kolom Kanan - Upload Gambar */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Gambar Produk <span className="text-red-500">*</span>
            </label>
            
            {/* Preview Gambar */}
            {imagePreview && (
              <div className="mb-4 relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-xl border-4 border-green-200 shadow-lg"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  ✓ Siap
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                      <p className="mt-3 text-sm text-gray-500 font-medium">Mengupload...</p>
                    </>
                  ) : (
                    <>
                      <div className="bg-green-100 p-3 rounded-full mb-3">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="mb-2 text-sm text-gray-700 font-semibold">
                        Klik untuk upload
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => handleImageUpload(e, isEdit)}
                  accept="image/*"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deskripsi Singkat <span className="text-red-500">*</span>
            </label>
            <textarea
              value={product.deskripsi}
              onChange={(e) => setProduct({...product, deskripsi: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              rows="3"
              placeholder="Deskripsi singkat tentang produk..."
              required
            />
          </div>
        </div>
      </div>

      {/* Text Areas Full Width */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Deskripsi Lengkap
        </label>
        <textarea
          value={product.deskripsi_lengkap}
          onChange={(e) => setProduct({...product, deskripsi_lengkap: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          rows="3"
          placeholder="Deskripsi detail tentang produk..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Cara Perawatan
        </label>
        <textarea
          value={product.cara_perawatan}
          onChange={(e) => setProduct({...product, cara_perawatan: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          rows="4"
          placeholder="• PENYIRAMAN: ...&#10;• CAHAYA: ...&#10;• KELEMBABAN: ..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-4">
        <button
          type="submit"
          disabled={loading || uploading}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEdit ? 'Memperbarui...' : 'Menambahkan...'}
            </>
          ) : (
            <>{isEdit ? '💾 Update Produk' : '💾 Simpan Produk'}</>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 text-white px-8 py-3 rounded-xl hover:bg-gray-600 transition shadow-lg"
        >
          ❌ Batal
        </button>
      </div>
    </form>
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Hanya admin yang dapat mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
                🌿 Green House Admin
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Selamat datang, <span className="font-semibold">{user?.email}</span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Produk</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalProducts}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-xl">
                <span className="text-3xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Stok</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalStock}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-xl">
                <span className="text-3xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Stok Menipis</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.lowStock}</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-xl">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Kategori</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.categories}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-xl">
                <span className="text-3xl">🗂️</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-4 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'products'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                📦 Kelola Produk
              </span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-4 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'categories'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                🗂️ Kategori
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
              {/* Header with Search and Filter */}
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    📦 Kelola Produk Tanaman
                  </h3>
                  
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="🔍 Cari produk..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-4 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent w-full md:w-64"
                      />
                    </div>

                    {/* Filter Category */}
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">🗂️ Semua Kategori</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name_kategori}
                        </option>
                      ))}
                    </select>

                    {/* Add Button */}
                    <button
                      onClick={() => {
                        setShowAddProduct(true);
                        setShowEditProduct(false);
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <span className="text-xl">+</span> Tambah Produk
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Product Form */}
              {showAddProduct && (
                <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-green-50">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      ➕ Tambah Produk Baru
                    </h4>
                    <button
                      onClick={() => {
                        setShowAddProduct(false);
                        setImagePreview(null);
                        setNewProduct({
                          nama_produk: '',
                          deskripsi: '',
                          deskripsi_lengkap: '',
                          harga: '',
                          stok: '',
                          gambar_url: '',
                          kategori_id: '',
                          durability: 'medium',
                          tingkat_kesulitan: 'Mudah',
                          max_pengiriman_hari: '3',
                          cara_perawatan: '',
                          icon: '🌿'
                        });
                      }}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <ProductForm
                    product={newProduct}
                    setProduct={setNewProduct}
                    onSubmit={handleAddProduct}
                    onCancel={() => {
                      setShowAddProduct(false);
                      setImagePreview(null);
                      setNewProduct({
                        nama_produk: '',
                        deskripsi: '',
                        deskripsi_lengkap: '',
                        harga: '',
                        stok: '',
                        gambar_url: '',
                        kategori_id: '',
                        durability: 'medium',
                        tingkat_kesulitan: 'Mudah',
                        max_pengiriman_hari: '3',
                        cara_perawatan: '',
                        icon: '🌿'
                      });
                    }}
                    isEdit={false}
                  />
                </div>
              )}

              {/* Edit Product Form */}
              {showEditProduct && editProduct && (
                <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      ✏️ Edit Produk
                    </h4>
                    <button
                      onClick={() => {
                        setShowEditProduct(false);
                        setEditProduct(null);
                        setImagePreview(null);
                      }}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <ProductForm
                    product={editProduct}
                    setProduct={setEditProduct}
                    onSubmit={handleEditProduct}
                    onCancel={() => {
                      setShowEditProduct(false);
                      setEditProduct(null);
                      setImagePreview(null);
                    }}
                    isEdit={true}
                  />
                </div>
              )}

              {/* Products List */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Memuat data produk...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Produk
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Harga
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Stok
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Kategori
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-green-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {product.gambar_url && (
                                  <img 
                                    src={product.gambar_url} 
                                    alt={product.nama_produk}
                                    className="h-16 w-16 rounded-xl object-cover mr-4 border-2 border-gray-200 shadow-md"
                                  />
                                )}
                                <div>
                                  <div className="text-sm font-bold text-gray-900">
                                    {product.nama_produk}
                                  </div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {product.deskripsi}
                                  </div>
                                  <div className="mt-1">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      product.tingkat_kesulitan === 'Mudah' 
                                        ? 'bg-green-100 text-green-700'
                                        : product.tingkat_kesulitan === 'Sedang'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                      {product.tingkat_kesulitan === 'Mudah' ? '🟢' : product.tingkat_kesulitan === 'Sedang' ? '🟡' : '🔴'} {product.tingkat_kesulitan}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">
                                Rp {parseInt(product.harga).toLocaleString('id-ID')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                                product.stok > 10 
                                  ? 'bg-green-100 text-green-800' 
                                  : product.stok > 0
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.stok} pcs
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                                {product.categories?.name_kategori}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditModal(product)}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition flex items-center gap-1 font-semibold"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id, product.gambar_url)}
                                  className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition flex items-center gap-1 font-semibold"
                                >
                                  🗑️ Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredProducts.length === 0 && (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-gray-500 text-lg">
                          {searchTerm || filterCategory 
                            ? 'Tidak ada produk yang cocok dengan pencarian'
                            : 'Belum ada produk. Tambah produk pertama Anda!'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="bg-white shadow-xl rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                🗂️ Kelola Kategori
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-green-300 transition transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-green-100 p-3 rounded-full">
                        <span className="text-2xl">📁</span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg">{category.name_kategori}</h4>
                    </div>
                    <p className="text-sm text-gray-500">
                      📅 Dibuat: {new Date(category.created_at).toLocaleDateString('id-ID', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-600">
                        <span className="font-semibold">{products.filter(p => p.kategori_id === category.id).length}</span> produk
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;