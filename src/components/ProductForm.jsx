// components/ProductForm.jsx

import React from 'react';

const ProductForm = ({
  product,
  setProduct,
  onSubmit,
  onCancel,
  isEdit,
  categories,
  imagePreview,
  uploading,
  handleImageUpload,
  loading
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Kolom Kiri */}
        <div className="space-y-4">

          {/* Nama Produk */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={product.nama_produk}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, nama_produk: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="Contoh: Philodendron Birkin"
              required
            />
          </div>

          {/* Harga + Stok */}
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Harga (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={product.harga}
                onChange={(e) =>
                  setProduct((prev) => ({ ...prev, harga: e.target.value }))
                }
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
                onChange={(e) =>
                  setProduct((prev) => ({ ...prev, stok: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="10"
                min="0"
                required
              />
            </div>

          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              value={product.kategori_id}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, kategori_id: e.target.value }))
              }
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
        </div>

        {/* Kolom Kanan – Upload Gambar */}
        <div className="space-y-4">

          {/* Preview & Ganti Gambar */}
          {imagePreview ? (
            <div className="relative group overflow-hidden rounded-xl border-4 border-green-200 shadow-lg">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold cursor-pointer hover:bg-gray-100 transition shadow-lg flex items-center gap-2">
                  Ganti Gambar
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => handleImageUpload(e, isEdit)}
                  />
                </label>
              </div>
              <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                ✓ Siap
              </div>
            </div>
          ) : (
            /* Box Upload (Hanya muncul jika belum ada gambar) */
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Gambar Produk <span className="text-red-500">*</span>
              </label>

              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                      <p className="mt-3 text-sm text-gray-500 font-medium">
                        Mengupload...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="bg-green-100 p-3 rounded-full mb-3">
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <p className="mb-2 text-sm font-semibold text-gray-700">
                        Klik untuk upload
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, JPEG (MAX. 5MB)
                      </p>
                    </>
                  )}
                </div>

                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => handleImageUpload(e, isEdit)}
                />
              </label>
            </div>
          )}

          {/* Deskripsi Singkat */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deskripsi Singkat <span className="text-red-500">*</span>
            </label>
            <textarea
              value={product.deskripsi}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, deskripsi: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              rows="3"
              placeholder="Deskripsi singkat tentang produk..."
              required
            />
          </div>

        </div>

      </div>

      {/* Full width fields */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Deskripsi Lengkap
        </label>
        <textarea
          value={product.deskripsi_lengkap}
          onChange={(e) =>
            setProduct((prev) => ({ ...prev, deskripsi_lengkap: e.target.value }))
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-xl"
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
          onChange={(e) =>
            setProduct((prev) => ({ ...prev, cara_perawatan: e.target.value }))
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-xl"
          rows="4"
          placeholder="Penyiraman..."
        />
      </div>

      {/* Buttons */}
      <div className="flex space-x-4 pt-4">
        <button
          type="submit"
          disabled={loading || uploading}
          className="bg-green-500 text-white px-8 py-3 rounded-xl"
        >
          {loading ? (isEdit ? "Memperbarui..." : "Menambahkan...") : isEdit ? " Update Produk" : " Simpan Produk"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="bg-red-500 text-white px-8 py-3 rounded-xl"
        >
          Batal
        </button>
      </div>

    </form>
  );
};

export default ProductForm;