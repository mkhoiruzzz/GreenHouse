import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatCurrency';

const AdminShipping = () => {
    const [shippingRates, setShippingRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCityModal, setShowCityModal] = useState(false);
    const [selectedCity, setSelectedCity] = useState(null);
    const [cityRates, setCityRates] = useState([]);
    const [showAddCourierModal, setShowAddCourierModal] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const [formData, setFormData] = useState({
        courier: '',
        cost: '',
        estimated_days: '',
        is_active: true
    });

    useEffect(() => {
        fetchShippingRates();
    }, []);

    const fetchShippingRates = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('shipping_rates')
                .select('*')
                .order('city', { ascending: true });

            if (error) throw error;
            setShippingRates(data || []);
        } catch (error) {
            console.error('Error fetching shipping rates:', error);
            toast.error('Gagal memuat tarif pengiriman');
        } finally {
            setLoading(false);
        }
    };

    // Group rates by city
    const groupedByCity = shippingRates.reduce((acc, rate) => {
        const key = `${rate.city}|${rate.province}`;
        if (!acc[key]) {
            acc[key] = {
                city: rate.city,
                province: rate.province,
                rates: []
            };
        }
        acc[key].rates.push(rate);
        return acc;
    }, {});

    const cityGroups = Object.values(groupedByCity);

    const handleCityClick = (cityGroup) => {
        setSelectedCity(cityGroup);
        setCityRates(cityGroup.rates);
        setShowCityModal(true);
    };

    const handleAddCourier = () => {
        setEditingRate(null);
        setFormData({
            courier: '',
            cost: '',
            estimated_days: '',
            is_active: true
        });
        setShowAddCourierModal(true);
    };

    const handleEditCourier = (rate) => {
        setEditingRate(rate);
        setFormData({
            courier: rate.courier,
            cost: rate.cost.toString(),
            estimated_days: rate.estimated_days,
            is_active: rate.is_active
        });
        setShowAddCourierModal(true);
    };

    const handleSubmitCourier = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                province: selectedCity.province,
                city: selectedCity.city,
                courier: formData.courier,
                cost: parseFloat(formData.cost),
                estimated_days: formData.estimated_days,
                is_active: formData.is_active
            };

            if (editingRate) {
                const { error } = await supabase
                    .from('shipping_rates')
                    .update(payload)
                    .eq('id', editingRate.id);

                if (error) throw error;
                toast.success('Kurir berhasil diperbarui');
            } else {
                const { error } = await supabase
                    .from('shipping_rates')
                    .insert([payload]);

                if (error) throw error;
                toast.success('Kurir berhasil ditambahkan');
            }

            setShowAddCourierModal(false);
            await fetchShippingRates();

            // Refresh city rates
            const updatedGroup = cityGroups.find(g => g.city === selectedCity.city);
            if (updatedGroup) {
                setCityRates(updatedGroup.rates);
            }
        } catch (error) {
            console.error('Error saving courier:', error);
            toast.error('Gagal menyimpan kurir');
        }
    };

    const handleDeleteCourier = async (id) => {
        if (!confirm('Yakin ingin menghapus kurir ini?')) return;

        try {
            const { error } = await supabase
                .from('shipping_rates')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Kurir berhasil dihapus');
            await fetchShippingRates();

            // Refresh city rates
            const updatedRates = cityRates.filter(r => r.id !== id);
            setCityRates(updatedRates);

            // Close modal if no more rates
            if (updatedRates.length === 0) {
                setShowCityModal(false);
            }
        } catch (error) {
            console.error('Error deleting courier:', error);
            toast.error('Gagal menghapus kurir');
        }
    };

    const toggleActive = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('shipping_rates')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Kurir ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
            await fetchShippingRates();

            // Refresh city rates
            const updatedRates = cityRates.map(r =>
                r.id === id ? { ...r, is_active: !currentStatus } : r
            );
            setCityRates(updatedRates);
        } catch (error) {
            console.error('Error toggling active status:', error);
            toast.error('Gagal mengubah status');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Manajemen Pengiriman</h2>
                    <p className="text-gray-600 text-sm">Kelola tarif ongkir per kota</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">Total Kota</p>
                    <p className="text-2xl font-bold text-blue-900">{cityGroups.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Total Kurir</p>
                    <p className="text-2xl font-bold text-green-900">{shippingRates.length}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium">Rata-rata Kurir/Kota</p>
                    <p className="text-2xl font-bold text-purple-900">
                        {cityGroups.length > 0 ? (shippingRates.length / cityGroups.length).toFixed(1) : 0}
                    </p>
                </div>
            </div>

            {/* City Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : cityGroups.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Belum ada tarif pengiriman</p>
                        <p className="text-sm text-gray-400 mt-2">Tambahkan tarif pertama Anda di tab ini</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Provinsi</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Kota</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Jumlah Kurir</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Rentang Harga</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {cityGroups.map((group, idx) => {
                                const costs = group.rates.map(r => parseFloat(r.cost));
                                const minCost = Math.min(...costs);
                                const maxCost = Math.max(...costs);
                                const activeCouriers = group.rates.filter(r => r.is_active).length;

                                return (
                                    <tr
                                        key={idx}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleCityClick(group)}
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-900">{group.province}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900">{group.city}</span>
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                    {activeCouriers} aktif
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                                {group.rates.length} kurir
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                                            {minCost === maxCost
                                                ? formatCurrency(minCost)
                                                : `${formatCurrency(minCost)} - ${formatCurrency(maxCost)}`
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCityClick(group);
                                                }}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                            >
                                                Detail Kurir →
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* City Detail Modal */}
            {showCityModal && selectedCity && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-white">Opsi Kurir - {selectedCity.city}</h2>
                                <p className="text-sm text-green-100">{selectedCity.province}</p>
                            </div>
                            <button
                                onClick={() => setShowCityModal(false)}
                                className="text-white hover:text-gray-200 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
                            {/* Add Courier Button */}
                            <button
                                onClick={handleAddCourier}
                                className="w-full py-3 border-2 border-dashed border-green-300 rounded-lg text-green-700 font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl">+</span> Tambah Kurir Baru
                            </button>

                            {/* Courier List */}
                            {cityRates.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Belum ada kurir untuk kota ini
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cityRates.map((rate) => (
                                        <div
                                            key={rate.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="text-lg font-bold text-gray-900">{rate.courier}</h3>
                                                        <button
                                                            onClick={() => toggleActive(rate.id, rate.is_active)}
                                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${rate.is_active
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                                }`}
                                                        >
                                                            {rate.is_active ? 'Aktif' : 'Nonaktif'}
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-500">Tarif: </span>
                                                            <span className="font-bold text-green-600">{formatCurrency(rate.cost)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Estimasi: </span>
                                                            <span className="font-medium text-gray-700">{rate.estimated_days}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleEditCourier(rate)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCourier(rate.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Courier Modal */}
            {showAddCourierModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">
                                {editingRate ? 'Edit Kurir' : 'Tambah Kurir Baru'}
                            </h2>
                            <button
                                onClick={() => setShowAddCourierModal(false)}
                                className="text-white hover:text-gray-200 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmitCourier} className="p-6 space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-blue-900">
                                    <span className="font-semibold">Kota:</span> {selectedCity.city}, {selectedCity.province}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Layanan *</label>
                                <select
                                    value={formData.courier}
                                    onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                    required
                                >
                                    <option value="">-- Pilih Tipe Layanan --</option>
                                    <option value="⚡ Express">⚡ Express</option>
                                    <option value="🚀 Instant">🚀 Instant</option>
                                    <option value="📦 Reguler">📦 Reguler</option>
                                    <option value="💰 Ekonomi">💰 Ekonomi</option>
                                    <option value="📮 Standar">📮 Standar</option>
                                    <option value="🚚 Kargo">🚚 Kargo</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Pilih tipe layanan pengiriman</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tarif (Rp) *</label>
                                <input
                                    type="number"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                    placeholder="Contoh: 20000"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estimasi Pengiriman *</label>
                                <input
                                    type="text"
                                    value={formData.estimated_days}
                                    onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                    placeholder="Contoh: 2-3 hari"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label className="text-sm text-gray-700">Kurir Aktif</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddCourierModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingRate ? 'Simpan' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminShipping;
