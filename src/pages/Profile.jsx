// Profile.jsx - UPDATE dengan fungsi hapus akun
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: ''
  });

  const navigate = useNavigate();

  // ✅ LOAD DATA DARI TABLE PROFILES
  useEffect(() => {
    const loadProfileData = async () => {
      if (user) {
        try {
          console.log('🔄 Loading profile data from profiles table...');
          
          // Coba ambil dari table profiles
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.log('❌ No profile data found, using user metadata');
            // Fallback ke user metadata
            setProfileData({
              username: user.user_metadata?.username || '',
              full_name: user.user_metadata?.full_name || '',
              email: user.email || '',
              phone: user.user_metadata?.phone || '',
              address: user.user_metadata?.address || '',
              city: user.user_metadata?.city || '',
              province: user.user_metadata?.province || ''
            });
          } else {
            console.log('✅ Profile data loaded from table:', data);
            // Data dari table profiles
            setProfileData({
              username: data.username || '',
              full_name: data.full_name || '',
              email: data.email || user.email,
              phone: data.phone || '',
              address: data.address || '',
              city: data.city || '',
              province: data.province || ''
            });
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };

    loadProfileData();
  }, [user]);

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile({
        username: profileData.username,
        full_name: profileData.full_name,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        province: profileData.province
      });

      if (result.success) {
        toast.success('Profil berhasil diperbarui!');
      } else {
        toast.error('Gagal memperbarui profil');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

// ✅ FUNGSI HAPUS AKUN DI PROFILE.JSX
const handleDeleteAccount = async () => {
  setDeleteLoading(true);
  try {
    const result = await deleteAccount();
    
    if (result.success) {
      toast.success(result.message);
      navigate('/');
    } else {
      toast.error(
        <div>
          <p>{result.message}</p>
          <p className="text-sm mt-1">
            Silakan hubungi admin jika masalah berlanjut.
          </p>
        </div>,
        { autoClose: 8000 }
      );
    }
  } catch (error) {
    console.error('Delete account error:', error);
    toast.error('Terjadi kesalahan tak terduga saat menghapus akun');
  } finally {
    setDeleteLoading(false);
    setShowDeleteConfirm(false);
  }
};

  return (
    <div className="min-h-screen mt-16 py-8 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-green-600 mb-6">Profil Saya</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={profileData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={profileData.full_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Telepon
              </label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat
              </label>
              <textarea
                name="address"
                value={profileData.address}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kota
                </label>
                <input
                  type="text"
                  name="city"
                  value={profileData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  name="province"
                  value={profileData.province}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>

          {/* ✅ SECTION HAPUS AKUN */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Zona Berbahaya
              </h3>
              <p className="text-red-700 text-sm mb-4">
                Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus permanen.
              </p>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Hapus Akun Saya
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-red-800 font-medium">
                    Yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan!
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Akun'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleteLoading}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition disabled:opacity-50"
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