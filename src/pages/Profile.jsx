import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data dummy untuk testing jika user null
  const userData = user || {
    name: 'hahhahaha',
    email: 'khoi@gmail.com',
    role: 'Customer',
    id: 'USR001'
  };
  
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    city: userData?.city || '',
    postalCode: userData?.postalCode || ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateUser(formData);
      toast.success('Profil berhasil diperbarui!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Gagal memperbarui profil. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: userData?.name || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      address: userData?.address || '',
      city: userData?.city || '',
      postalCode: userData?.postalCode || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen mt-16 py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Profil Saya</h1>
          <p className="text-gray-600">Kelola informasi profil Anda untuk mengontrol, melindungi dan mengamankan akun</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Info Singkat */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {userData?.name?.charAt(0) || 'U'}
                </div>
                <h2 className="text-xl font-bold text-gray-800">{userData?.name || 'User'}</h2>
                <p className="text-gray-600">{userData?.email || 'user@example.com'}</p>
                <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm inline-block">
                  {userData?.role || 'Customer'}
                </div>
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Member sejak</span>
                  <span className="font-medium">2025</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Total Pesanan</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600">Aktif</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Form Profil */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary">Informasi Profil</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition"
                  >
                    Edit Profil
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={handleCancel}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition disabled:opacity-50"
                    >
                      {loading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nama */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap *
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Masukkan nama lengkap"
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        {userData?.name || 'Belum diisi'}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="email@example.com"
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        {userData?.email || 'Belum diisi'}
                      </div>
                    )}
                  </div>

                  {/* Telepon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Telepon
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="081234567890"
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        {userData?.phone || 'Belum diisi'}
                      </div>
                    )}
                  </div>

                  {/* Kota */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kota
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Nama kota"
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        {userData?.city || 'Belum diisi'}
                      </div>
                    )}
                  </div>

                  {/* Kode Pos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kode Pos
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="12345"
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        {userData?.postalCode || 'Belum diisi'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Alamat Lengkap */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat Lengkap
                  </label>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Masukkan alamat lengkap"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 min-h-[80px]">
                      {userData?.address || 'Belum diisi'}
                    </div>
                  )}
                </div>
              </form>

              {/* Additional Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Akun</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">ID Pengguna</span>
                    <span className="font-medium">#{userData?.id || 'USR001'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Terakhir Login</span>
                    <span className="font-medium">18 Okt 2025, 14:53</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Tipe Akun</span>
                    <span className="font-medium">{userData?.role || 'Customer'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Verifikasi Email</span>
                    <span className="font-medium text-green-600">Terverifikasi</span>
                  </div>
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