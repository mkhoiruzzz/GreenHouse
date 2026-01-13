import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

const AdminCategories = ({ onCategoryChange }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name_kategori', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Gagal memuat kategori');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            const { error } = await supabase
                .from('categories')
                .insert([{ name_kategori: newCategoryName.trim() }]);

            if (error) throw error;
            toast.success('Kategori berhasil ditambahkan');
            setNewCategoryName('');
            setShowAddForm(false);
            fetchCategories();
            if (onCategoryChange) onCategoryChange();
        } catch (error) {
            toast.error('Gagal menambah kategori: ' + error.message);
        }
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (!editingCategory.name_kategori.trim()) return;

        try {
            const { error } = await supabase
                .from('categories')
                .update({ name_kategori: editingCategory.name_kategori.trim() })
                .eq('id', editingCategory.id);

            if (error) throw error;
            toast.success('Kategori berhasil diperbarui');
            setEditingCategory(null);
            fetchCategories();
            if (onCategoryChange) onCategoryChange();
        } catch (error) {
            toast.error('Gagal memperbarui kategori: ' + error.message);
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm(`Hapus kategori "${name}"? Produk dengan kategori ini mungkin perlu diupdate manual.`)) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Kategori dihapus');
            fetchCategories();
            if (onCategoryChange) onCategoryChange();
        } catch (error) {
            toast.error('Gagal menghapus kategori: ' + error.message);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Manajemen Kategori</h3>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-all shadow-sm"
                >
                    + Tambah Kategori
                </button>
            </div>

            {/* Form Tambah */}
            {showAddForm && (
                <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm animate-fade-in">
                    <form onSubmit={handleAddCategory} className="flex gap-4">
                        <input
                            type="text"
                            required
                            autoFocus
                            className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition-all"
                            placeholder="Contoh: Tanaman Indoor"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                        />
                        <button type="submit" className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all">Simpan</button>
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-6 py-3 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all"
                        >Batal</button>
                    </form>
                </div>
            )}

            {/* List Kategori */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                        Belum ada kategori. Klik "+ Tambah Kategori" untuk memulai.
                    </div>
                ) : categories.map(cat => (
                    <div key={cat.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                        {editingCategory && editingCategory.id === cat.id ? (
                            <form onSubmit={handleUpdateCategory} className="flex gap-2 w-full">
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
                                    value={editingCategory.name_kategori}
                                    onChange={e => setEditingCategory({ ...editingCategory, name_kategori: e.target.value })}
                                />
                                <button type="submit" className="text-green-600 font-bold text-sm px-2">Simpan</button>
                                <button type="button" onClick={() => setEditingCategory(null)} className="text-gray-400 text-sm px-2">Batal</button>
                            </form>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 text-xl">🏷️</div>
                                    <span className="font-semibold text-gray-700">{cat.name_kategori}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setEditingCategory(cat)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >✏️</button>
                                    <button
                                        onClick={() => handleDeleteCategory(cat.id, cat.name_kategori)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus"
                                    >🗑️</button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminCategories;
