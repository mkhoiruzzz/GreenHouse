// AdminDashboard.jsx FINAL VERSION
// --- Full integration with ProductForm.jsx ---
// This file is fully cleaned, optimized, and safely separated from the form.

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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch {
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
    } catch {
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
      // JANGAN sertakan id, created_at, updated_at - biar database handle
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
    fetchProducts();

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
      tingkat_kesulitan: editProduct.tingkat_kesulitan || "Mudah",
      max_pengiriman_hari: Number(editProduct.max_pengiriman_hari) || 3,
      cara_perawatan: editProduct.cara_perawatan || "",
      icon: editProduct.icon || "🌿"
      // JANGAN sertakan updated_at - biar database handle otomatis
    };

    console.log("Update payload:", payload);

    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", editProduct.id);

    if (error) throw error;

    toast.success("Produk berhasil diperbarui");
    fetchProducts();

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

  const handleDeleteProduct = async (id) => {
    if (!confirm("Hapus produk ini?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;

      toast.success("Produk dihapus");
      fetchProducts();
    } catch {
      toast.error("Gagal menghapus produk");
    }
  };

  const filteredProducts = products.filter((p) => {
    const search = searchTerm.toLowerCase();
    const sMatch = p.nama_produk.toLowerCase().includes(search);
    const cMatch = filterCategory === "" || p.kategori_id == filterCategory;
    return sMatch && cMatch;
  });

  // Test connection dulu
const testConnection = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(1);
    
  if (error) console.error("RLS Error:", error);
  else console.log("Connection OK");
};

  return (
    <div className="min-h-screen bg-green-50 p-4">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_kategori}
            </option>
          ))}
        </select>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => {
            setShowAddProduct(true);
            setShowEditProduct(false);
            setNewProduct(emptyProduct);
            setImagePreview(null);
          }}
        >
          + Tambah Produk
        </button>
      </div>

      {/* ADD PRODUCT */}
      {showAddProduct && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Tambah Produk</h2>

          <ProductForm
            product={newProduct}
            setProduct={setNewProduct}
            onSubmit={handleAddProduct}
            onCancel={() => setShowAddProduct(false)}
            isEdit={false}
            categories={categories}
            imagePreview={imagePreview}
            uploading={uploading}
            loading={loading}
            handleImageUpload={handleImageUpload}
          />
        </div>
      )}

      {/* EDIT PRODUCT */}
      {showEditProduct && editProduct && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Edit Produk</h2>

          <ProductForm
            product={editProduct}
            setProduct={setEditProduct}
            onSubmit={handleUpdateProduct}
            onCancel={() => setShowEditProduct(false)}
            isEdit={true}
            categories={categories}
            imagePreview={imagePreview}
            uploading={uploading}
            loading={loading}
            handleImageUpload={handleImageUpload}
          />
        </div>
      )}

      {/* PRODUCT LIST */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Daftar Produk</h2>

        {loading ? (
          <p>Memuat...</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Produk</th>
                <th className="p-3 text-left">Harga</th>
                <th className="p-3 text-left">Stok</th>
                <th className="p-3 text-left">Kategori</th>
                <th className="p-3 text-left">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 flex items-center gap-3">
                    <img
                      src={p.gambar_url}
                      alt="thumb"
                      className="w-14 h-14 object-cover rounded"
                    />
                    <div>
                      <p className="font-bold">{p.nama_produk}</p>
                      <p className="text-sm text-gray-600">{p.deskripsi}</p>
                    </div>
                  </td>
                  <td className="p-3">Rp {Number(p.harga).toLocaleString("id-ID")}</td>
                  <td className="p-3">{p.stok}</td>
                  <td className="p-3">{p.categories?.name_kategori}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                      onClick={() => {
                        setEditProduct(p);
                        setShowEditProduct(true);
                        setShowAddProduct(false);
                        setImagePreview(p.gambar_url);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded"
                      onClick={() => handleDeleteProduct(p.id)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
