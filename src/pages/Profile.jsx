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

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) {
        console.log('⏳ Waiting for user...');
        return;
      }
  
      console.log('🔄 Loading profile data for user:', user.id);
      console.log('📧 User email:', user.email);
      
      try {
        // ✅ Pastikan query benar-benar dijalankan
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        console.log('📡 Query response - error:', error);
        console.log('📡 Query response - data:', data);
  
        if (error) {
          console.error('❌ Error fetching profile:', error);
          throw error;
        }
  
        if (!data) {
          console.warn('⚠️ No data returned from query');
          return;
        }
  
        // ✅ CRITICAL FIX: Ganti nama variabel
        const loadedData = {
          username: data.username || '',
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          province: data.province || ''
        };
        
        console.log('✅ Loaded data:', loadedData);
        setProfileData(loadedData);
        console.log('✅ State updated successfully');
        
      } catch (error) {
        console.error('❌ Error loading profile:', error);
        
        // Fallback ke user metadata
        const fallbackData = {
          username: user.user_metadata?.username || '',
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          address: user.user_metadata?.address || '',
          city: user.user_metadata?.city || '',
          province: user.user_metadata?.province || ''
        };
        
        console.log('📋 Using fallback data:', fallbackData);
        setProfileData(fallbackData);
      }
    };
  
    // ✅ Pastikan user.id ada sebelum load
    if (user?.id) {
      loadProfileData();
    }
  }, [user?.id]);

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
      console.log('💾 Saving profile data:', profileData);
      
      const result = await updateProfile({
        username: profileData.username,
        full_name: profileData.full_name,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        province: profileData.province
      });

      if (result.success) {
        console.log('✅ Profile updated successfully');
        toast.success('Profil berhasil diperbarui!');
        
        // ✅ Reload profile data setelah update
        setTimeout(async () => {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single();
            
            if (data) {
              console.log('🔄 Reloaded profile data:', data);
              setProfileData({
                username: data.username || '',
                full_name: data.full_name || '',
                email: data.email || currentUser.email || '',
                phone: data.phone || '',
                address: data.address || '',
                city: data.city || '',
                province: data.province || ''
              });
            }
          }
        }, 500);
      } else {
        console.error('❌ Failed to update profile:', result.message);
        toast.error(result.message || 'Gagal memperbarui profil');
      }
    } catch (error) {
      console.error('❌ Update profile error:', error);
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
      toast.success(result.message || 'Akun berhasil dihapus');
      
      // ✅ Langsung redirect tanpa delay untuk memastikan logout
      // Clear semua state dan redirect
      setTimeout(() => {
        // Clear semua storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect ke home dengan force reload
        window.location.href = '/';
      }, 500);
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
    
    // ✅ Tetap redirect meskipun ada error (karena state sudah di-clear)
    setTimeout(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }, 1000);
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

          <button
  onClick={async () => {
    console.log('🔄 Manual reload triggered');
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('👤 Current user:', currentUser);
      
      if (!currentUser?.id) {
        console.error('❌ No user found');
        toast.error('User tidak ditemukan');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      console.log('📡 Manual query - data:', data);
      console.log('📡 Manual query - error:', error);
      
      if (error) {
        console.error('❌ Query error:', error);
        toast.error('Gagal load profile: ' + error.message);
        return;
      }
      
      if (data) {
        const newData = {
          username: data.username || '',
          full_name: data.full_name || '',
          email: data.email || currentUser.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          province: data.province || ''
        };
        
        console.log('✅ Setting new data:', newData);
        setProfileData(newData);
        toast.success('Profile reloaded!');
      }
    } catch (err) {
      console.error('❌ Manual reload error:', err);
      toast.error('Error: ' + err.message);
    }
  }}
  className="mb-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
>
  🔄 Reload Profile Data
</button>
          
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