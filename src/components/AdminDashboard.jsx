// AdminDashboard.jsx FIXED VERSION
// Fixed: Delete function with proper image cleanup

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { toast } from "react-toastify";
import ProductForm from "../components/ProductForm";
import AdminOrders from "./AdminOrders";
import AdminUsers from "./AdminUsers";
import AdminAnalytics from "./AdminAnalytics"; // ✅ NEW
import AdminShipping from "./AdminShipping"; // ✅ NEW

const AdminDashboard = () => {
  const { user, logout, isAdmin, loading: authLoading } = useAuth(); // ✅ Get loading state
  const navigate = useNavigate(); // ✅ Use useNavigate

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
    // ✅ ONLY redirect if NOT loading AND NOT admin
    if (!authLoading && !isAdmin) {
      toast.error("Akses ditolak.");
      navigate("/", { replace: true }); // ✅ Use navigate instead of window.location
    }
  }, [isAdmin, authLoading, navigate]);

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
    if (isAdmin && !authLoading) {
      fetchProducts();
      fetchCategories();
    }
  }, [fetchProducts, fetchCategories, isAdmin, authLoading]);

  // ✅ Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Memeriksa akses admin...</p>
        </div>
      </div>
    );
  }

  // Double check protection (render nothing if not admin to prevent flash)
  if (!isAdmin) return null;

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

      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editProduct.id)
        .select(); // ✅ Add select() to verify update

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Update gagal - Data tidak berubah (Periksa ID atau Koneksi)");
      }

      const updatedProduct = data[0];

      // ✅ CHECK FOR STOCK MISMATCH (Trigger detected)
      if (updatedProduct.stok !== payload.stok) {
        const diff = payload.stok - updatedProduct.stok;

        // Cek apakah ada order pending yang menyebabkan pengurangan stok
        const { data: pendingItems } = await supabase
          .from('order_items')
          .select(`
                quantity,
                orders!inner (
                    status_pembayaran
                )
            `)
          .eq('product_id', editProduct.id)
          .in('orders.status_pembayaran', ['pending', 'unpaid']);

        const pendingCount = pendingItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

        if (diff === pendingCount) {
          toast.info(`Info: Stok tersimpan ${updatedProduct.stok}. (Dikurangi ${pendingCount} item dari pesanan pending)`);
        } else {
          toast.warning(`Perhatian: Stok tersimpan ${updatedProduct.stok} (Input: ${payload.stok}). Mungkin ada pesanan aktif.`);
        }
      } else {
        toast.success("Produk berhasil diperbarui");
      }

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
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white shadow-xl flex flex-col z-10 transition-all duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-center">
          <h1 className="text-2xl font-bold text-green-700 tracking-tight flex items-center gap-2">
            🌿 GreenHouse
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <button
            onClick={() => setActiveTab("products")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "products"
              ? "bg-green-50 text-green-700 shadow-sm translate-x-1"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <span className="text-xl">📦</span>
            Produk
          </button>

          <button
            onClick={() => setActiveTab("categories")} // Placeholder if category management is added later, or logic for category tab
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "categories"
              ? "bg-green-50 text-green-700 shadow-sm translate-x-1"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <span className="text-xl">🏷️</span>
            Kategori
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "orders"
              ? "bg-green-50 text-green-700 shadow-sm translate-x-1"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <span className="text-xl">📋</span>
            Pesanan
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "users"
              ? "bg-green-50 text-green-700 shadow-sm translate-x-1"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <span className="text-xl">👥</span>
            Pengguna
          </button>

          {/* ✅ NEW: Analytics Tab */}
          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "analytics"
              ? "bg-green-50 text-green-700 shadow-sm translate-x-1"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <span className="text-xl">📊</span>
            Analitik
          </button>

          {/* ✅ NEW: Shipping Tab */}
          <button
            onClick={() => setActiveTab("shipping")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "shipping"
              ? "bg-green-50 text-green-700 shadow-sm translate-x-1"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <span className="text-xl">🚚</span>
            Pengiriman
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={async () => {
              try {
                setLoading(true);
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user) return;

                const { error } = await supabase.from('profiles').upsert({
                  id: user.id,
                  email: 'admin@example.com',
                  role: 'admin',
                  full_name: 'Administrator',
                  username: 'admin'
                });

                if (error) throw error;
                toast.success("Permission Synced! Try updating product now.");
              } catch (err) {
                toast.error("Sync Failed: " + err.message);
              } finally {
                setLoading(false);
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-colors duration-200 font-medium"
          >
            🛠️ Fix Permissions
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200 font-medium"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden h-screen">
        {/* TOP NAVBAR */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm z-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800 capitalize">
              {activeTab === "products" ? "Manajemen Produk" :
                activeTab === "orders" ? "Daftar Pesanan" :
                  activeTab === "users" ? "Data Pengguna" :
                    activeTab === "analytics" ? "Dashboard Analitik" :
                      activeTab === "shipping" ? "Manajemen Pengiriman" :
                        activeTab === "categories" ? "Kategori" : "Dashboard"}
            </h2>
            <p className="text-sm text-gray-500">
              Selamat datang kembali, Admin
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border border-green-200">
              A
            </div>
          </div>
        </header>

        {/* CONTENT SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* CONTENT LOGIC */}
            {activeTab === "orders" && <AdminOrders />}
            {activeTab === "users" && <AdminUsers />}
            {activeTab === "analytics" && <AdminAnalytics />} {/* ✅ NEW */}
            {activeTab === "shipping" && <AdminShipping />} {/* ✅ NEW */}
            {activeTab === "categories" && (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-gray-100">
                <span className="text-6xl mb-4">🚧</span>
                <h3 className="text-xl font-bold text-gray-700">Fitur Kategori Segera Hadir</h3>
                <p className="text-gray-500 mt-2">Anda masih bisa mengelola kategori melalui database Supabase</p>
              </div>
            )}

            {activeTab === "products" && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl">📦</div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Total Produk</p>
                      <h3 className="text-2xl font-bold text-gray-800">{products.length}</h3>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-2xl">🏷️</div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Kategori</p>
                      <h3 className="text-2xl font-bold text-gray-800">{categories.length}</h3>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center text-2xl">⚠️</div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Stok &lt; 10</p>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {products.filter(p => p.stok < 10 && p.stok > 0).length}
                      </h3>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-2xl">❌</div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Habis</p>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {products.filter(p => p.stok === 0).length}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Filter Bar & Action */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="🔍 Cari produk..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition-all w-64"
                      />
                      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
                    </div>

                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                    >
                      <option value="">Semua Kategori</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name_kategori}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setShowAddProduct(true);
                      setShowEditProduct(false);
                      setNewProduct(emptyProduct);
                      setImagePreview(null);
                    }}
                    className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <span>+</span> Tambah Produk
                  </button>
                </div>

                {/* ADD/EDIT MODALS PLACEMENT - FIXED OVERLAY */}
                {(showAddProduct || showEditProduct) && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
                      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          {showAddProduct ? "➕ Tambah Produk Baru" : "✏️ Edit Produk"}
                        </h2>
                        <button
                          onClick={() => { setShowAddProduct(false); setShowEditProduct(false); }}
                          className="text-white hover:text-gray-200 text-2xl font-bold transition-transform hover:rotate-90"
                        >✕</button>
                      </div>

                      <div className="p-6 md:p-8">
                        <ProductForm
                          product={showAddProduct ? newProduct : editProduct}
                          setProduct={showAddProduct ? setNewProduct : setEditProduct}
                          onSubmit={showAddProduct ? handleAddProduct : handleUpdateProduct}
                          onCancel={() => { setShowAddProduct(false); setShowEditProduct(false); }}
                          isEdit={!!showEditProduct}
                          categories={categories}
                          imagePreview={imagePreview}
                          uploading={uploading}
                          loading={loading}
                          handleImageUpload={handleImageUpload}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PRODUCT LIST TABLE */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produk</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {loading ? (
                          <tr><td colSpan="5" className="p-8 text-center text-gray-500">Memuat data...</td></tr>
                        ) : filteredProducts.length === 0 ? (
                          <tr><td colSpan="5" className="p-8 text-center text-gray-500">Tidak ada produk ditemukan</td></tr>
                        ) : filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                  <img src={p.gambar_url} alt={p.nama_produk} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{p.nama_produk}</p>
                                  <p className="text-xs text-gray-500 line-clamp-1">{p.icon} {p.deskripsi}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                              Rp {Number(p.harga).toLocaleString("id-ID")}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.stok > 10 ? 'bg-green-50 text-green-700' :
                                p.stok > 0 ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-red-50 text-red-700'
                                }`}>
                                {p.stok > 0 ? `${p.stok} unit` : 'Habis'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {p.categories?.name_kategori || 'Original'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => { setEditProduct(p); setShowEditProduct(true); setShowAddProduct(false); setImagePreview(p.gambar_url); }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id, p)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;