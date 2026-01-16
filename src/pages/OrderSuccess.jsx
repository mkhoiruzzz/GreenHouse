import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { tripayService } from '../services/tripay';

const OrderSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'pending', 'error'
    const reference = searchParams.get('tripay_reference');

    useEffect(() => {
        const verifyPayment = async () => {
            if (!reference) {
                // Jika tidak ada reference, anggap berhasil (mungkin redirect manual atau mock)
                setStatus('success');
                return;
            }

            try {
                const response = await tripayService.checkTransaction(reference);
                if (response.success && response.data) {
                    const tripayStatus = response.data.status;
                    if (tripayStatus === 'PAID') {
                        setStatus('success');
                    } else {
                        setStatus('pending');
                    }
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('Error verifying payment:', error);
                setStatus('error');
            }
        };

        verifyPayment();
    }, [reference]);

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-12 flex items-center justify-center">
            <div className="max-w-md w-full mx-auto px-4 text-center">
                {status === 'loading' && (
                    <div className="space-y-4">
                        <div className="w-24 h-24 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-600">Memverifikasi pembayaran Anda...</p>
                    </div>
                )}

                {status === 'success' && (
                    <>
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
                    </>
                )}

                {(status === 'pending' || status === 'error' || status === 'expired') && (
                    <>
                        <div className="mb-8 relative inline-block">
                            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center animate-pulse">
                                <svg className="w-12 h-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            {status === 'error' ? 'Gagal Verifikasi' : 'Menunggu Pembayaran'}
                        </h1>
                        <p className="text-gray-600 mb-8">
                            {status === 'error'
                                ? 'Terjadi kesalahan saat memverifikasi pembayaran. Silakan cek status pesanan Anda.'
                                : 'Pembayaran Anda belum kami terima atau sedang diproses oleh pihak bank/Tripay.'}
                        </p>
                    </>
                )}

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
