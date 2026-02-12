import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatCurrency';

const AdminVouchers = () => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newVoucher, setNewVoucher] = useState({
        code: '',
        discount_type: 'percentage',
        amount: '',
        min_purchase: '',
        expiry_date: '',
        is_active: true
    });

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('vouchers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVouchers(data || []);
        } catch (error) {
            console.error('Error fetching vouchers:', error);
            toast.error('Gagal memuat daftar voucher');
        } finally {
            setLoading(false);
        }
    };

    const handleAddVoucher = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('vouchers')
                .insert([{
                    ...newVoucher,
                    code: newVoucher.code.toUpperCase(),
                    amount: parseFloat(newVoucher.amount),
                    min_purchase: parseFloat(newVoucher.min_purchase || 0),
                    expiry_date: newVoucher.expiry_date || null
                }]);

            if (error) throw error;
            toast.success('Voucher berhasil ditambahkan');
            setShowAddForm(false);
            setNewVoucher({
                code: '',
                discount_type: 'percentage',
                amount: '',
                min_purchase: '',
                expiry_date: '',
                is_active: true
            });
            fetchVouchers();
        } catch (error) {
            toast.error('Gagal menambah voucher: ' + error.message);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('vouchers')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchVouchers();
        } catch (error) {
            toast.error('Gagal mengubah status');
        }
    };

    const deleteVoucher = async (id) => {
        if (!window.confirm('Hapus voucher ini?')) return;
        try {
            const { error } = await supabase
                .from('vouchers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Voucher dihapus');
            fetchVouchers();
        } catch (error) {
            toast.error('Gagal menghapus voucher');
        }
    };

    if (loading) return <div className="text-center py-10">Memuat...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Kupon & Promo</h3>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                >
                    + Buat Kupon Baru
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                    <form onSubmit={handleAddVoucher} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Kode Kupon</label>
                            <input
                                type="text"
                                required
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 uppercase"
                                placeholder="MISAL: DAUN10"
                                value={newVoucher.code}
                                onChange={e => setNewVoucher({ ...newVoucher, code: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tipe Diskon</label>
                            <select
                                className="w-full p-2 border rounded-lg"
                                value={newVoucher.discount_type}
                                onChange={e => setNewVoucher({ ...newVoucher, discount_type: e.target.value })}
                            >
                                <option value="percentage">Persentase (%)</option>
                                <option value="fixed">Nominal Tetap (Rp)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Jumlah Diskon</label>
                            <input
                                type="number"
                                required
                                className="w-full p-2 border rounded-lg"
                                placeholder={newVoucher.discount_type === 'percentage' ? 'Contoh: 10' : 'Contoh: 15000'}
                                value={newVoucher.amount}
                                onChange={e => setNewVoucher({ ...newVoucher, amount: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Min. Pembelian (Opsional)</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded-lg"
                                placeholder="0"
                                value={newVoucher.min_purchase}
                                onChange={e => setNewVoucher({ ...newVoucher, min_purchase: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tanggal Kadaluarsa</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded-lg"
                                value={newVoucher.expiry_date}
                                onChange={e => setNewVoucher({ ...newVoucher, expiry_date: e.target.value })}
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold">Simpan Voucher</button>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="px-4 py-2 border rounded-lg text-gray-500"
                            >Batal</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                        <thead>
                            <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                                <th className="px-6 py-4 text-left">Kode</th>
                                <th className="px-6 py-4 text-left">Diskon</th>
                                <th className="px-6 py-4 text-left">Syarat Min.</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {vouchers.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Belum ada voucher</td></tr>
                            ) : vouchers.map(v => (
                                <tr key={v.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-green-700">{v.code}</td>
                                    <td className="px-6 py-4">
                                        {v.discount_type === 'percentage' ? `${v.amount}%` : formatCurrency(v.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {v.min_purchase > 0 ? formatCurrency(v.min_purchase) : 'Tanpa Minimum'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleStatus(v.id, v.is_active)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                                        >
                                            {v.is_active ? 'Aktif' : 'Non-aktif'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-center space-x-2">
                                        <button onClick={() => deleteVoucher(v.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminVouchers;
