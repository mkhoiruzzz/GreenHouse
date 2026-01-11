// Profile.jsx - FINAL WORKING VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, profile, isAdmin, loading: authLoading, updateProfile, deleteAccount, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    avatar_url: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Tunggu sampai auth loading selesai
    if (authLoading) return;

    if (user) {
      console.log('👤 Profile page: user found, setting data');
      const currentProfile = profile || user.user_metadata;

      setFormData({
        username: currentProfile?.username || user.email?.split('@')[0] || '',
        full_name: currentProfile?.full_name || '',
        email: user.email || '',
        phone: currentProfile?.phone || '',
        address: currentProfile?.address || '',
        city: currentProfile?.city || '',
        province: currentProfile?.province || '',
        avatar_url: currentProfile?.avatar_url || ''
      });

      if (currentProfile?.avatar_url) {
        setImagePreview(currentProfile.avatar_url);
      }
    } else {
      console.log('👤 Profile page: no user found');
    }

    setLoading(false);
  }, [user, profile, authLoading]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran gambar maksimal 2MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (userId) => {
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      let finalAvatarUrl = formData.avatar_url;

      if (imageFile) {
        finalAvatarUrl = await uploadAvatar(user.id);
      }

      const result = await updateProfile({
        ...formData,
        avatar_url: finalAvatarUrl
      });

      if (result.success) {
        toast.success('✅ Profil berhasil diperbarui!');
        await refreshProfile(); // Refresh context data
        setImageFile(null); // Clear pending file
      } else {
        toast.error(`❌ ${result.message || 'Gagal memperbarui profil'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('❌ Gagal memperbarui profil: ' + error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteLoading) return;
    setDeleteLoading(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        // Redirect is handled in AuthContext
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ✅ LOADING STATE: Tunggu auth selesai
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-500 animate-pulse text-sm">Memuat profil...</p>
        </div>
      </div>
    );
  }

  // ✅ REDIRECT JIKA TIDAK LOGIN
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100 max-w-sm mx-auto">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Akses Terbatas</h2>
          <p className="text-gray-600 mb-6">Silakan login terlebih dahulu untuk mengakses halaman profil Anda.</p>
          <a
            href="/login"
            className="inline-block w-full bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-100"
          >
            Pindah ke Halaman Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 mt-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="h-32 bg-green-600 relative">
            <div className="absolute -bottom-16 left-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                      👤
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-green-500 p-2 rounded-full text-white cursor-pointer hover:bg-green-600 transition shadow-md group-hover:scale-110">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-20 pb-8 px-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{formData.full_name || formData.username}</h1>
                <p className="text-gray-500">{user.email} • {isAdmin ? 'Administrator' : 'Customer'}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Status: Aktif</span>
                {imageFile && <span className="text-xs text-orange-500 animate-pulse">Foto baru siap diunggah</span>}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">No. Telepon</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                    placeholder="08xx-xxxx-xxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kota</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat Lengkap</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Provinsi</label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex-1 bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {saveLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : 'Simpan Perubahan'}
                </button>
              </div>
            </form>

            {/* Danger Zone */}
            <div className="mt-12 pt-8 border-t border-gray-100">
              <h2 className="text-xl font-bold text-red-600 mb-4">Zona Bahaya</h2>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-500 font-semibold hover:text-red-700 transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus Akun Permanen
                </button>
              ) : (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                  <p className="text-red-800 font-bold mb-2">Apakah Anda yakin?</p>
                  <p className="text-red-600 text-sm mb-4">Semua data pesanan, riwayat, dan profil akan dihapus selamanya.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
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
  );
};

export default Profile;