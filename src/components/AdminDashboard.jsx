// AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { toast } from "react-toastify";
import ProductForm from "../components/ProductForm";
import AdminOrders from "./AdminOrders";
import AdminUsers from "./AdminUsers";
import AdminAnalytics from "./AdminAnalytics";
import AdminShipping from "./AdminShipping";
import AdminVouchers from "./AdminVouchers";
import AdminCategories from "./AdminCategories";
import AdminOverview from "./AdminOverview";
import AdminRefunds from "./AdminRefunds";

const AdminDashboard = () => {
  const { user, logout, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    if (!authLoading && !isAdmin) {
      toast.error("Akses ditolak.");
      navigate("/", { replace: true });
    }
  }, [isAdmin, authLoading, navigate]);

  // Handle URL query param for tab switching
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name_kategori)")
        .or("is_deleted.is.null,is_deleted.eq.false")
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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

  if (!isAdmin) return null;

  const handleImageUpload = async (event, isEdit) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }

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

      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select();

      if (error) throw error;

      toast.success("Produk berhasil ditambahkan");
      await fetchProducts();
      setShowAddProduct(false);
      setImagePreview(null);
      setNewProduct(emptyProduct);
    } catch (error) {
      console.error("Add product error:", error);
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

      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editProduct.id)
        .select();

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
      const { error } = await supabase
        .from("products")
        .update({ is_deleted: true, stok: 0 })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Produk "${productData.nama_produk}" berhasil dihapus!`);
      await fetchProducts();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Gagal menghapus produk: ${error.message}`);
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

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Navbar */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative z-[101]"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-green-700 flex items-center gap-2">
            🌿 GreenHouse
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[90] md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Sidebar - Desktop & Mobile Drawer */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-[95]
        w-64 bg-white shadow-xl flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between md:justify-center">
          <h1 className="text-2xl font-bold text-green-700 tracking-tight flex items-center gap-2">
            🌿 GreenHouse
          </h1>
          <button
            onClick={closeMobileMenu}
            className="md:hidden text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
          {/* Section: Manajemen Utama */}
          <div>
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Manajemen Utama</p>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab("dashboard"); closeMobileMenu(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "dashboard" ? "bg-green-50 text-green-700 shadow-sm translate-x-1" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => { setActiveTab("analytics"); closeMobileMenu(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "analytics" ? "bg-green-50 text-green-700 shadow-sm translate-x-1" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                Analitik
              </button>
              <button
                onClick={() => { setActiveTab("products"); closeMobileMenu(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "products" ? "bg-green-50 text-green-700 shadow-sm translate-x-1" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                Produk
              </button>
              <button
                onClick={() => { setActiveTab("categories"); closeMobileMenu(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "categories" ? "bg-green-50 text-green-700 shadow-sm translate-x-1" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                Kategori
              </button>
              <button
                onClick={() => { setActiveTab("orders"); navigate('/admin?tab=orders'); closeMobileMenu(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "orders" ? "bg-green-50 text-green-700 shadow-sm translate-x-1" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                Pesanan
              </button>
              <button
                onClick={() => { setActiveTab("users"); closeMobileMenu(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "users" ? "bg-green-50 text-green-700 shadow-sm translate-x-1" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                Pengguna
              </button>
            </div>
          </div>

          {/* Section: Operasional & Promosi */}
          <div>
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Operasional & Promosi</p>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab("shipping"); closeMobileMenu(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "shipping" ? "bg-green-50 text-green-700 shadow-sm translate-x-1" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                Pengiriman
              </button>
              <button
                onClick={() => { setActiveTab("vouchers"); closeMobileMenu(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "vouchers" ? "bg-green-50 text-green-700 shadow-sm translate-x-1" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                Voucher
              </button>
              <button
                onClick={() => { setActiveTab("refunds"); closeMobileMenu(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === "refunds" ? "bg-red-50 text-red-700 shadow-sm translate-x-1" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                Retur & Refund
              </button>
            </div>
          </div>

          {/* Section: Akun */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                if (window.confirm("Apakah Anda yakin ingin keluar dari dashboard admin?")) {
                  logout();
                  navigate("/");
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-red-600 hover:bg-red-50"
            >
              <span>🚪 Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      <main className={`flex-1 flex flex-col overflow-hidden h-screen ${isMobileMenuOpen ? 'pointer-events-none md:pointer-events-auto' : ''}`}>
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 capitalize">
              {activeTab}
            </h2>
            <p className="text-xs md:text-sm text-gray-500">
              Selamat datang kembali, Admin
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === "dashboard" && <AdminOverview onSwitchTab={setActiveTab} />}
            {activeTab === "orders" && <AdminOrders />}
            {activeTab === "users" && <AdminUsers />}
            {activeTab === "analytics" && <AdminAnalytics />}
            {activeTab === "shipping" && <AdminShipping />}
            {activeTab === "vouchers" && <AdminVouchers />}
            {activeTab === "refunds" && <AdminRefunds />}
            {activeTab === "categories" && <AdminCategories onCategoryChange={fetchCategories} />}

            {activeTab === "products" && (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Cari produk..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 border rounded-lg text-sm w-full md:w-64"
                    />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-4 py-2 border rounded-lg text-sm w-full md:w-auto"
                    >
                      <option value="">Semua Kategori</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name_kategori}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => { setShowAddProduct(true); setShowEditProduct(false); setImagePreview(null); }}
                    className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 w-full md:w-auto"
                  >
                    + Tambah Produk
                  </button>
                </div>

                {(showAddProduct || showEditProduct) && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                      <div className="px-6 py-4 flex justify-between items-center bg-green-600 text-white">
                        <h2 className="text-xl font-bold">
                          {showAddProduct ? "Tambah Produk" : "Edit Produk"}
                        </h2>
                        <button onClick={() => { setShowAddProduct(false); setShowEditProduct(false); }}>✕</button>
                      </div>
                      <div className="p-6">
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

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase">Produk</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase">Harga</th>
                          <th className="px-6 py-4 text-center font-semibold text-gray-500 uppercase">Stok</th>
                          <th className="px-6 py-4 text-center font-semibold text-gray-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredProducts.map((p) => (
                          <tr key={p.id}>
                            <td className="px-6 py-4 flex items-center gap-4">
                              <img src={p.gambar_url} alt="" className="w-12 h-12 object-cover rounded" />
                              <div>
                                <p className="font-semibold">{p.nama_produk}</p>
                                <p className="text-xs text-gray-500">{p.categories?.name_kategori}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">Rp {Number(p.harga).toLocaleString()}</td>
                            <td className="px-6 py-4 text-center">{p.stok}</td>
                            <td className="px-6 py-4 text-center">
                              <button onClick={() => { setEditProduct(p); setShowEditProduct(true); setImagePreview(p.gambar_url); }} className="text-blue-600 mr-2">✏️</button>
                              <button onClick={() => handleDeleteProduct(p.id, p)} className="text-red-600">🗑️</button>
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
