import React from 'react';
import { useNavigate } from 'react-router-dom';

const OrderSuccess = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-12 flex items-center justify-center">
            <div className="max-w-md w-full mx-auto px-4 text-center">
                {/* Success Animation/Icon */}
                <div className="mb-8 relative inline-block">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                        <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    {/* Decorative particles */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                </div>

                {/* Text Content */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Pembayaran Berhasil!</h1>
                <p className="text-gray-600 mb-8">
                    Terima kasih telah berbelanja di Green House. Pesanan Anda sedang kami proses dan akan segera dikirim.
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/orders')}
                        className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                    >
                        Cek Daftar Pesanan
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 bg-white text-green-600 border-2 border-green-600 rounded-xl font-bold hover:bg-green-50 transition-colors"
                    >
                        Kembali ke Beranda
                    </button>
                </div>

                {/* Tip */}
                <p className="mt-12 text-sm text-gray-500 italic">
                    💡 Tips: Anda dapat memantau status pengiriman di halaman "Pesanan Saya".
                </p>
            </div>
        </div>
    );
};

export default OrderSuccess;
