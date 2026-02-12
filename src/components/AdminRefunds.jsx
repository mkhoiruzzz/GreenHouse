import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatCurrency';

const AdminRefunds = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProof, setSelectedProof] = useState(null);
    const [selectedRefund, setSelectedRefund] = useState(null); // For Approval Modal
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        fetchRefunds();
    }, []);

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabaseAdmin
                .from('refunds')
                .select(`
                    *,
                    orders (id, total_harga, status_pembayaran, status_pengiriman),
                    profiles:user_id (id, username, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRefunds(data || []);
        } catch (error) {
            console.error('Error fetching refunds:', error);
            toast.error('Gagal memuat daftar retur');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus, orderId, note = '') => {
        try {
            const updatePayload = { status: newStatus };
            if (note) updatePayload.admin_note = note;

            const { error: refundError } = await supabaseAdmin
                .from('refunds')
                .update(updatePayload)
                .eq('id', id);

            if (refundError) throw refundError;

            // Optional: If approved, update order status to 'returned'
            if (newStatus === 'approved') {
                const { error: orderError } = await supabaseAdmin
                    .from('orders')
                    .update({ status_pengiriman: 'returned' })
                    .eq('id', orderId);

                if (orderError) {
                    console.warn('Order status not updated:', orderError.message);
                }
            }

            toast.success(`Permintaan refund berhasil di-${newStatus}`);
            setSelectedRefund(null);
            setAdminNote('');
            fetchRefunds();

            // ✅ Kirim notifikasi ke user via database
            const refundData = refunds.find(r => r.id === id);
            if (refundData && refundData.user_id) {
                console.log('📝 Inserting refund notification for user:', refundData.user_id);
                const isApproved = newStatus === 'approved';
                const { error: notifError } = await supabase.from('notifications').insert({
                    user_id: refundData.user_id,
                    type: 'refund',
                    title: isApproved ? 'Refund Disetujui ✅' : 'Refund Ditolak ❌',
                    message: isApproved
                        ? `Pengajuan refund pesanan #${refundData.order_id} telah disetujui.${note ? ` Catatan: ${note}` : ''}`
                        : `Mohon maaf, pengajuan refund pesanan #${refundData.order_id} ditolak.`,
                    order_id: refundData.order_id,
                    link: '/orders'
                });

                if (notifError) console.error('❌ Failed to insert refund notification:', notifError);
                else console.log('✅ Refund notification inserted successfully');
            }
        } catch (error) {
            console.error('Error updating refund:', error);
            toast.error('Gagal memperbarui status refund');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Manajemen Retur & Refund</h3>
                <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                    <span className="animate-ping w-2 h-2 bg-red-600 rounded-full"></span>
                    {refunds.filter(r => r.status === 'pending').length} Permintaan Baru
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[768px] text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-600 uppercase">Pelanggan</th>
                                <th className="px-6 py-4 font-bold text-gray-600 uppercase">Order ID</th>
                                <th className="px-6 py-4 font-bold text-gray-600 uppercase">Alasan</th>
                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-center">Bukti</th>
                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-center">Status</th>
                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-700">
                            {refunds.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400 italic">
                                        Tidak ada permintaan refund saat ini
                                    </td>
                                </tr>
                            ) : (
                                refunds.map((refund) => (
                                    <tr key={refund.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{refund.profiles?.username}</div>
                                            <div className="text-xs text-gray-500">{refund.profiles?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            #{refund.order_id}
                                            <div className="mt-1 font-bold text-red-600">
                                                {formatCurrency(refund.orders?.total_harga)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="line-clamp-2 italic text-gray-600">"{refund.reason}"</p>
                                            {refund.admin_note && (
                                                <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700">
                                                    <strong>Catatan Admin:</strong> {refund.admin_note}
                                                </div>
                                            )}
                                            <div className="text-[10px] text-gray-400 mt-1">
                                                Diajukan: {new Date(refund.created_at).toLocaleString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {refund.proof_image_url ? (
                                                <button
                                                    onClick={() => setSelectedProof(refund.proof_image_url.split(','))}
                                                    className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1 mx-auto"
                                                >
                                                    📸 {refund.proof_image_url.split(',').length} File
                                                </button>
                                            ) : (
                                                <span className="text-gray-300">Tidak Ada</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${refund.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                refund.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {refund.status === 'pending' ? 'Menunggu' :
                                                    refund.status === 'approved' ? 'Disetujui' :
                                                        refund.status === 'rejected' ? 'Ditolak' : refund.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {refund.status === 'pending' ? (
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => setSelectedRefund(refund)}
                                                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                                                        title="Setujui & Tambah Catatan"
                                                    >
                                                        ✅
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Tolak permintaan refund ini?')) {
                                                                handleUpdateStatus(refund.id, 'rejected', refund.order_id);
                                                            }
                                                        }}
                                                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                                                        title="Tolak"
                                                    >
                                                        ❌
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">Tuntas</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Approval Modal with Admin Note */}
            {selectedRefund && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                            ✅ Setujui Pengembalian Dana
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                            Berikan bukti transfer atau catatan penyelesaian agar pelanggan tahu dana telah dikembalikan.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catatan Admin (Opsional)</label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none h-24"
                                    placeholder="Contoh: Dana telah ditransfer ke BCA xxxx atau Ref: 123456"
                                ></textarea>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setSelectedRefund(null);
                                        setAdminNote('');
                                    }}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(selectedRefund.id, 'approved', selectedRefund.order_id, adminNote)}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all"
                                >
                                    Konfirmasi & Selesai
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Proof Lightbox */}
            {selectedProof && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-8 backdrop-blur-md">
                    <div className="bg-white rounded-3xl w-full max-w-4xl p-6 relative shadow-2xl overflow-hidden">
                        <button
                            onClick={() => setSelectedProof(null)}
                            className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full hover:bg-red-100 hover:text-red-600 z-10"
                        >
                            ✕
                        </button>
                        <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                            🖼️ Bukti Refund ({selectedProof.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
                            {selectedProof.map((url, i) => (
                                <div key={i} className="group relative rounded-2xl overflow-hidden shadow-md border border-gray-100">
                                    {url.match(/\.(mp4|mov|webm)$/i) || url.includes('/video/') ? (
                                        <video src={url} controls className="w-full h-48 object-cover" />
                                    ) : (
                                        <a href={url} target="_blank" rel="noopener noreferrer">
                                            <img src={url} alt={`Proof ${i}`} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setSelectedProof(null)}
                                className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all"
                            >
                                Tutup Galeri
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRefunds;
