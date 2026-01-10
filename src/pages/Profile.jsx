// Profile.jsx - FINAL WORKING VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, profile, updateProfile, deleteAccount } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: ''
  });

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ✅ SIMPLE: Set data langsung dari profile context atau user
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Profile useEffect - User:', user.email);
    console.log('📊 Profile context:', profile);

    // Gunakan profile dari context jika ada
    if (profile) {
      console.log('✅ Using profile from context');
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        email: profile.email || user.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        province: profile.province || ''
      });
    } else {
      // Fallback ke user metadata
      console.log('⚠️ Using user metadata as fallback');
      setFormData({
        username: user.user_metadata?.username || user.email?.split('@')[0] || '',
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        address: user.user_metadata?.address || '',
        city: user.user_metadata?.city || '',
        province: user.user_metadata?.province || ''
      });
    }

    setLoading(false);
  }, [user, profile]); // ✅ Hanya depend on user dan profile

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      console.log('💾 Saving profile:', formData);

      const result = await updateProfile({
        username: formData.username,
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        province: formData.province
      });

      if (result.success) {
        toast.success('✅ Profil berhasil diperbarui!');
        // Refresh setelah 2 detik
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(`❌ ${result.message || 'Gagal memperbarui profil'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('❌ Gagal memperbarui profil');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const result = await deleteAccount();

      if (result.success) {
        toast.success('✅ Akun berhasil dihapus');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        toast.error(`❌ ${result.message || 'Gagal menghapus akun'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('❌ Terjadi kesalahan');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Silakan Login</h2>
          <a href="/login" className="text-green-600 hover:underline">
            Ke Halaman Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-700">Profil Saya</h1>
            <p className="text-gray-600 mt-2">Kelola informasi profil Anda</p>
          </div>

          {/* User Info Card */}
          <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-green-800">Informasi Akun</h2>
                <div className="mt-2 space-y-1">
                  <p className="text-gray-700">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">User ID:</span> {user.id}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Status:</span>
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Aktif
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  console.log('=== DEBUG INFO ===');
                  console.log('User:', user);
                  console.log('Profile context:', profile);
                  console.log('Form data:', formData);
                }}
                className="mt-4 md:mt-0 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition"
              >
                Debug Info
              </button>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="Masukkan username"
                  required
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              {/* Email (disabled) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
                <p className="text-sm text-gray-500 mt-2">Email tidak dapat diubah</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Telepon
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="0812-3456-7890"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kota
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="Kota"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Lengkap
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="Jl. Contoh No. 123, RT/RW ..."
                />
              </div>

              {/* Province */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provinsi
                </label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="Provinsi"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={saveLoading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menyimpan...
                  </span>
                ) : 'Simpan Perubahan'}
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Refresh Data
              </button>
            </div>
          </form>

          {/* Delete Account Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-red-800">Hapus Akun</h3>
                  <p className="text-red-700 text-sm mt-2">
                    Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus permanen dari sistem.
                  </p>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="mt-4 bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition"
                    >
                      Hapus Akun Saya
                    </button>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="bg-red-100 border border-red-300 p-4 rounded-lg">
                        <p className="text-red-800 font-semibold">
                          ⚠️ Anda yakin ingin menghapus akun?
                        </p>
                        <p className="text-red-700 text-sm mt-2">
                          Semua data akan dihapus termasuk:
                        </p>
                        <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                          <li>Profil pengguna</li>
                          <li>Riwayat transaksi</li>
                          <li>Data keranjang belanja</li>
                          <li>Semua data terkait akun ini</li>
                        </ul>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading}
                          className="flex-1 bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                        >
                          {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Akun'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={deleteLoading}
                          className="flex-1 bg-gray-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-600 transition disabled:opacity-50"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;