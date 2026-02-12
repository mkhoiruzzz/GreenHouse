// Profile.jsx - FINAL WORKING VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
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
    if (authLoading) return;

    if (user) {
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
        toast.success('Profil berhasil diperbarui!');
        await refreshProfile();
        setImageFile(null);
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
        // Redirect handled in AuthContext
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

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
    <div className="min-h-screen relative overflow-hidden bg-[#f0f4f0]">
      {/* Decorative Botanical Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] opacity-10 pointer-events-none">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#2D5A27" d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.7,-31.3,87,-15.7,85.6,-0.8C84.2,14.1,78.1,28.2,69.2,40.6C60.3,53,48.6,63.7,35.2,71.1C21.8,78.4,6.7,82.4,-8.1,79.5C-22.9,76.6,-37.4,66.8,-49.2,55.1C-61,43.4,-70.1,29.8,-74.6,14.8C-79.1,-0.2,-79,-16.5,-73.4,-30.9C-67.8,-45.3,-56.7,-57.8,-43.6,-65.2C-30.5,-72.6,-15.3,-74.9,0.3,-75.4C15.9,-75.9,31.3,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
        </svg>
      </div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] opacity-10 pointer-events-none rotate-180">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#2D5A27" d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.7,-31.3,87,-15.7,85.6,-0.8C84.2,14.1,78.1,28.2,69.2,40.6C60.3,53,48.6,63.7,35.2,71.1C21.8,78.4,6.7,82.4,-8.1,79.5C-22.9,76.6,-37.4,66.8,-49.2,55.1C-61,43.4,-70.1,29.8,-74.6,14.8C-79.1,-0.2,-79,-16.5,-73.4,-30.9C-67.8,-45.3,-56.7,-57.8,-43.6,-65.2C-30.5,-72.6,-15.3,-74.9,0.3,-75.4C15.9,-75.9,31.3,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
        </svg>
      </div>

      <div className="relative z-10 w-full min-h-screen pt-24 pb-12 px-6 lg:px-12 flex flex-col">
        {/* Profile Header Sections */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full border-4 border-white bg-white/50 backdrop-blur-md overflow-hidden shadow-2xl ring-4 ring-green-100/50">
              {imagePreview ? (
                <img src={imagePreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl">
                  👤
                </div>
              )}
            </div>
            <label className="absolute bottom-2 right-2 bg-green-600 p-3 rounded-full text-white cursor-pointer hover:bg-green-700 transition-all shadow-xl hover:scale-110 active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
            {imageFile && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full animate-bounce shadow-lg">
                Klik Simpan untuk ganti foto
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold tracking-widest uppercase mb-4 shadow-sm border border-green-200">
              {isAdmin ? 'Administrator' : ''}
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-gray-900 mb-2 tracking-tight">
              {formData.full_name || formData.username}
            </h1>
            <p className="text-xl text-gray-600 font-medium">{user.email}</p>
          </div>
        </div>

        {/* Main Content Area - Full Width Grid */}
        <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Side: General Info */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Masukkan username"
                  className="w-full px-6 py-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500/50 outline-none transition-all placeholder:text-gray-400 font-semibold text-gray-800 shadow-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Nama sesuai identitas"
                  className="w-full px-6 py-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500/50 outline-none transition-all placeholder:text-gray-400 font-semibold text-gray-800 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">No. Telepon</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="08xx-xxxx-xxxx"
                  className="w-full px-6 py-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500/50 outline-none transition-all placeholder:text-gray-400 font-semibold text-gray-800 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Kota</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Kota tempat tinggal"
                  className="w-full px-6 py-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500/50 outline-none transition-all placeholder:text-gray-400 font-semibold text-gray-800 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Jl. Nama Jalan, No. Rumah, RT/RW..."
                rows="4"
                className="w-full px-6 py-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500/50 outline-none transition-all placeholder:text-gray-400 font-semibold text-gray-800 shadow-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Provinsi</label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                placeholder="Provinsi di Indonesia"
                className="w-full px-6 py-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500/50 outline-none transition-all placeholder:text-gray-400 font-semibold text-gray-800 shadow-sm"
              />
            </div>
          </div>

          {/* Right Side: Actions & Danger Zone */}
          <div className="lg:col-span-4 flex flex-col gap-12">
            <div className="flex flex-col gap-4">
              <button
                type="submit"
                disabled={saveLoading}
                className="w-full bg-green-600 text-white font-black py-6 rounded-3xl hover:bg-green-700 transition-all shadow-[0_20px_50px_rgba(22,163,74,0.3)] hover:shadow-[0_25px_60px_rgba(22,163,74,0.4)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 flex items-center justify-center text-lg tracking-wider uppercase group"
              >
                {saveLoading ? (
                  <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    Simpan Perubahan
                    <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
              <p className="text-center text-[10px] font-semibold text-gray-400 italic">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            <div className="mt-auto pt-8 border-t border-gray-200">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Danger Section</h2>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-4 px-6 border border-red-200 text-red-500 rounded-2xl font-bold hover:bg-red-50 transition-all flex items-center justify-between group"
                >
                  <span>Hapus Akun</span>
                  <svg className="w-5 h-5 transition-transform group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              ) : (
                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-red-100 shadow-2xl">
                  <p className="text-red-600 font-black text-lg mb-2">Konfirmasi Penghapusan</p>
                  <p className="text-gray-500 text-xs font-medium mb-6 leading-relaxed">Ini akan menghapus semua riwayat transaksi, voucher, dan data pribadi Anda secara permanen.</p>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg disabled:opacity-50"
                    >
                      {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Permanen'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;