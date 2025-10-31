// components/DeleteAccountModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const { deleteAccount, deleteAccountWithoutPassword, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1: warning, 2: password confirmation
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      
      // Untuk testing/demo, bisa pakai tanpa password
      const result = await deleteAccountWithoutPassword();
      
      // Untuk production, pakai dengan password:
      // const result = await deleteAccount(password);
      
      if (result.success) {
        onClose();
        // Redirect akan otomatis terjadi karena state berubah di AuthContext
      }
    } catch (error) {
      console.error('Delete account error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setStep(1);
    setIsDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Step 1: Warning */}
        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Hapus Akun Permanen
              </h3>
              <p className="text-gray-600 mb-4">
                Apakah Anda yakin ingin menghapus akun Anda? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-red-800 mb-2">Yang akan terjadi:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Semua data profil akan dihapus</li>
                <li>• Riwayat pesanan akan dihapus</li>
                <li>• Item di keranjang akan dihapus</li>
                <li>• Anda akan logout otomatis</li>
                <li>• Tidak dapat dikembalikan</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                disabled={isDeleting}
              >
                Batalkan
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                disabled={isDeleting}
              >
                Lanjutkan
              </button>
            </div>
          </>
        )}

        {/* Step 2: Password Confirmation */}
        {step === 2 && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Konfirmasi Penghapusan
              </h3>
              <p className="text-gray-600 mb-4">
                Masukkan password Anda untuk mengonfirmasi penghapusan akun.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isDeleting}
              />
              <p className="text-xs text-gray-500 mt-2">
                Untuk keamanan, kami perlu memverifikasi identitas Anda.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                disabled={isDeleting}
              >
                Kembali
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={!password || isDeleting}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menghapus...
                  </>
                ) : (
                  'Hapus Akun Permanen'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteAccountModal;