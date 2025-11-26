// AdminDashboard.jsx FIXED VERSION
// Fixed: Delete function with proper image cleanup

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { toast } from "react-toastify";
import ProductForm from "../components/ProductForm";

const AdminDashboard = () => {
  const { user, logout, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const emptyProduct = {
    nama_produk: "",
    deskripsi: "",
    deskripsi_lengkap: "",
    harga: "",
    stok: "",
    gambar_url: "",
    kategori_id: "",
    max_pengiriman_hari: "3",
    cara_perawatan: "",
    icon: "🌿",
  };

  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Akses ditolak.");
      window.location.href = "/";
    }
  }, [isAdmin]);

const fetchProducts = useCallback(async () => {
  try {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name_kategori)")
      .or("is_deleted.is.null,is_deleted.eq.false") // ✅ Filter produk yang tidak dihapus
      .order("created_at", { ascending: false });

    if (error) throw error;
    setProducts(data || []);
  } catch (error) {
    console.error("Error fetching products:", error);
    toast.error("Gagal memuat produk");
  } finally {
    setLoading(false);
  }
}, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleImageUpload = async (event, isEdit) => {
    try {
      setUploading(true);

      const file = event.target.files?.[0];
      if (!file) return;

      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }

      // Validasi tipe file
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error("Format file harus JPG, PNG, atau WEBP");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("products")
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);

      const url = data.publicUrl;

      if (isEdit) setEditProduct((p) => ({ ...p, gambar_url: url }));
      else setNewProduct((p) => ({ ...p, gambar_url: url }));

      toast.success("Gambar berhasil diupload");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    // Validasi data wajib
    if (!newProduct.nama_produk || !newProduct.harga || !newProduct.stok || 
        !newProduct.kategori_id || !newProduct.gambar_url || !newProduct.deskripsi) {
      toast.error("Harap isi semua field yang wajib diisi");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        nama_produk: newProduct.nama_produk,
        deskripsi: newProduct.deskripsi,
        deskripsi_lengkap: newProduct.deskripsi_lengkap || "",
        harga: Number(newProduct.harga),
        stok: Number(newProduct.stok),
        gambar_url: newProduct.gambar_url,
        kategori_id: newProduct.kategori_id,
        max_pengiriman_hari: Number(newProduct.max_pengiriman_hari) || 3,
        cara_perawatan: newProduct.cara_perawatan || "",
        icon: newProduct.icon || "🌿"
      };

      console.log("Payload yang dikirim:", payload);

      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select();

      if (error) {
        console.error("Error detail:", error);
        throw error;
      }

      toast.success("Produk berhasil ditambahkan");
      await fetchProducts();

      setShowAddProduct(false);
      setImagePreview(null);
      setNewProduct(emptyProduct);
      
    } catch (error) {
      console.error("Full error:", error);
      toast.error(`Gagal menambahkan produk: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = {
        nama_produk: editProduct.nama_produk,
        deskripsi: editProduct.deskripsi,
        deskripsi_lengkap: editProduct.deskripsi_lengkap || "",
        harga: Number(editProduct.harga),
        stok: Number(editProduct.stok),
        gambar_url: editProduct.gambar_url,
        kategori_id: editProduct.kategori_id,
        max_pengiriman_hari: Number(editProduct.max_pengiriman_hari) || 3,
        cara_perawatan: editProduct.cara_perawatan || "",
        icon: editProduct.icon || "🌿"
      };

      console.log("Update payload:", payload);

      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editProduct.id);

      if (error) throw error;

      toast.success("Produk berhasil diperbarui");
      await fetchProducts();

      setShowEditProduct(false);
      setEditProduct(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Gagal memperbarui produk: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

const handleDeleteProduct = async (id, productData) => {
  if (!window.confirm(`Apakah Anda yakin ingin menghapus produk "${productData.nama_produk}"?`)) {
    return;
  }

  try {
    setLoading(true);
    console.log("🗑️ Memulai proses hapus produk ID:", id);

    // ✅ SELALU GUNAKAN SOFT DELETE
    // Cek dulu apakah produk pernah dipesan
    const { data: orderItems, error: checkError } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("❌ Error checking order items:", checkError);
      throw new Error("Gagal mengecek riwayat pesanan");
    }

    const hasOrders = orderItems && orderItems.length > 0;

    if (hasOrders) {
      console.log("⚠️ Produk pernah dipesan, melakukan SOFT DELETE...");
      
      // SOFT DELETE - Tandai sebagai dihapus
      const { error: softDeleteError } = await supabase
        .from("products")
        .update({ 
          is_deleted: true,
          stok: 0
        })
        .eq("id", id);

      if (softDeleteError) {
        console.error("❌ Error soft delete:", softDeleteError);
        throw softDeleteError;
      }

      toast.success(`✅ Produk "${productData.nama_produk}" berhasil dihapus dari katalog!`);
      console.log("✅ Soft delete berhasil - produk disembunyikan dari katalog");

    } else {
      console.log("ℹ️ Produk belum pernah dipesan, tetap gunakan SOFT DELETE untuk konsistensi");
      
      // TETAP SOFT DELETE untuk konsistensi
      const { error: softDeleteError } = await supabase
        .from("products")
        .update({ 
          is_deleted: true,
          stok: 0
        })
        .eq("id", id);

      if (softDeleteError) {
        console.error("❌ Error soft delete:", softDeleteError);
        throw softDeleteError;
      }

      // Opsional: Hapus gambar jika ingin menghemat storage
      if (productData?.gambar_url) {
        try {
          const urlParts = productData.gambar_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          
          console.log("🖼️ Menghapus gambar:", fileName);
          
          const { error: storageError } = await supabase.storage
            .from('products')
            .remove([fileName]);
          
          if (storageError) {
            console.warn("⚠️ Gagal menghapus gambar, tapi produk sudah dihapus:", storageError.message);
          } else {
            console.log("✅ Gambar berhasil dihapus dari storage");
          }
        } catch (storageErr) {
          console.warn("⚠️ Error saat hapus gambar:", storageErr.message);
        }
      }

      toast.success(`✅ Produk "${productData.nama_produk}" berhasil dihapus!`);
      console.log("✅ Soft delete berhasil");
    }

    // Refresh list produk
    await fetchProducts();
    
  } catch (error) {
    console.error("❌ Error menghapus produk:", error);
    toast.error(`Gagal menghapus produk: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// ============================================
// OPSIONAL: Tambah fitur RESTORE produk
// ============================================
const handleRestoreProduct = async (id, productData) => {
  if (!window.confirm(`Restore produk "${productData.nama_produk}" kembali ke katalog?`)) {
    return;
  }

  try {
    setLoading(true);
    
    const { error } = await supabase
      .from("products")
      .update({ 
        is_deleted: false,
        stok: 1 // Restore dengan stok minimal
      })
      .eq("id", id);

    if (error) throw error;

    toast.success(`Produk "${productData.nama_produk}" berhasil di-restore!`);
    await fetchProducts();
    
  } catch (error) {
    console.error("Error restore produk:", error);
    toast.error(`Gagal restore produk: ${error.message}`);
  } finally {
    setLoading(false);
  }
};


  const filteredProducts = products.filter((p) => {
    const search = searchTerm.toLowerCase();
    const sMatch = p.nama_produk.toLowerCase().includes(search);
    const cMatch = filterCategory === "" || p.kategori_id == filterCategory;
    return sMatch && cMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Kelola produk tanaman Anda</p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            >
              <option value="">🏷️ Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_kategori}
                </option>
              ))}
            </select>

            <button
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              onClick={() => {
                setShowAddProduct(true);
                setShowEditProduct(false);
                setNewProduct(emptyProduct);
                setImagePreview(null);
              }}
            >
              <span className="text-xl">+</span>
              Tambah Produk
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-medium">Total Produk</p>
              <p className="text-2xl font-bold text-blue-700">{products.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <p className="text-sm text-green-600 font-medium">Kategori</p>
              <p className="text-2xl font-bold text-green-700">{categories.length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <p className="text-sm text-purple-600 font-medium">Hasil Filter</p>
              <p className="text-2xl font-bold text-purple-700">{filteredProducts.length}</p>
            </div>
          </div>
        </div>

        {/* ADD PRODUCT */}
        {showAddProduct && (
          <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">➕ Tambah Produk Baru</h2>
            </div>
            <div className="p-6">
              <ProductForm
                product={newProduct}
                setProduct={setNewProduct}
                onSubmit={handleAddProduct}
                onCancel={() => {
                  setShowAddProduct(false);
                  setImagePreview(null);
                  setNewProduct(emptyProduct);
                }}
                isEdit={false}
                categories={categories}
                imagePreview={imagePreview}
                uploading={uploading}
                loading={loading}
                handleImageUpload={handleImageUpload}
              />
            </div>
          </div>
        )}

        {/* EDIT PRODUCT */}
        {showEditProduct && editProduct && (
          <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">✏️ Edit Produk</h2>
            </div>
            <div className="p-6">
              <ProductForm
                product={editProduct}
                setProduct={setEditProduct}
                onSubmit={handleUpdateProduct}
                onCancel={() => {
                  setShowEditProduct(false);
                  setEditProduct(null);
                  setImagePreview(null);
                }}
                isEdit={true}
                categories={categories}
                imagePreview={imagePreview}
                uploading={uploading}
                loading={loading}
                handleImageUpload={handleImageUpload}
              />
            </div>
          </div>
        )}

        {/* PRODUCT LIST */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
            <h2 className="text-xl font-bold text-white">📦 Daftar Produk</h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="mt-4 text-gray-600">Memuat produk...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌱</div>
                <p className="text-xl font-semibold text-gray-700 mb-2">Tidak ada produk</p>
                <p className="text-gray-500">Mulai tambahkan produk pertama Anda</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="p-4 text-left text-sm font-bold text-gray-700">Produk</th>
                      <th className="p-4 text-left text-sm font-bold text-gray-700">Harga</th>
                      <th className="p-4 text-left text-sm font-bold text-gray-700">Stok</th>
                      <th className="p-4 text-left text-sm font-bold text-gray-700">Kategori</th>
                      <th className="p-4 text-center text-sm font-bold text-gray-700">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr 
                        key={p.id} 
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={p.gambar_url}
                              alt={p.nama_produk}
                              className="w-16 h-16 object-cover rounded-xl shadow-md"
                            />
                            <div>
                              <p className="font-bold text-gray-800">{p.nama_produk}</p>
                              <p className="text-sm text-gray-500 line-clamp-1">{p.deskripsi}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-green-600">
                            Rp {Number(p.harga).toLocaleString("id-ID")}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            p.stok > 10 
                              ? 'bg-green-100 text-green-700' 
                              : p.stok > 0 
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {p.stok} unit
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {p.categories?.name_kategori || '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => {
                                setEditProduct(p);
                                setShowEditProduct(true);
                                setShowAddProduct(false);
                                setImagePreview(p.gambar_url);
                              }}
                              disabled={loading}
                            >
                              ✏️ Edit
                            </button>

                            <button
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleDeleteProduct(p.id, p)}
                              disabled={loading}
                            >
                              {loading ? "⏳" : "🗑️"} Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;