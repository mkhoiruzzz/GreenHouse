// AdminUsers.jsx - User Management untuk Admin
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatCurrency';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);

            // Get all users from auth.users via profiles table
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            // Get order count for each user
            const usersWithStats = await Promise.all(
                (profiles || []).map(async (profile) => {
                    const { data: orders } = await supabase
                        .from('orders')
                        .select('id, total_harga, status_pembayaran')
                        .eq('user_id', profile.id);

                    const totalOrders = orders?.length || 0;
                    const totalSpent = orders
                        ?.filter(o => o.status_pembayaran === 'paid')
                        .reduce((sum, o) => sum + parseFloat(o.total_harga || 0), 0) || 0;

                    return {
                        ...profile,
                        totalOrders,
                        totalSpent
                    };
                })
            );

            setUsers(usersWithStats);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Gagal memuat data pengguna');
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', userId);

            if (error) throw error;

            toast.success(`Status pengguna berhasil diubah menjadi ${newStatus}`);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user status:', error);
            toast.error('Gagal mengubah status pengguna');
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toString().includes(searchTerm)
    );

    const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active' || !u.status).length,
        inactive: users.filter(u => u.status === 'inactive').length,
        totalOrders: users.reduce((sum, u) => sum + u.totalOrders, 0)
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium">Total Users</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-100">
                    <p className="text-sm text-green-600 font-medium">Active Users</p>
                    <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-100">
                    <p className="text-sm text-yellow-600 font-medium">Inactive Users</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.inactive}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-100">
                    <p className="text-sm text-purple-600 font-medium">Total Orders</p>
                    <p className="text-2xl font-bold text-purple-700">{stats.totalOrders}</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <input
                    type="text"
                    placeholder="🔍 Cari pengguna (email, nama)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                />
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">👥 Daftar Pengguna</h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">👤</div>
                        <p className="text-xl font-semibold text-gray-700">Tidak ada pengguna</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 text-left text-sm font-bold text-gray-700">User</th>
                                    <th className="p-4 text-left text-sm font-bold text-gray-700">Email</th>
                                    <th className="p-4 text-left text-sm font-bold text-gray-700">Total Pesanan</th>
                                    <th className="p-4 text-left text-sm font-bold text-gray-700">Total Belanja</th>
                                    <th className="p-4 text-left text-sm font-bold text-gray-700">Status</th>
                                    <th className="p-4 text-left text-sm font-bold text-gray-700">Tanggal Daftar</th>
                                    <th className="p-4 text-center text-sm font-bold text-gray-700">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                                                    {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {user.full_name || 'Tidak ada nama'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-gray-600">{user.email || '-'}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-blue-600">{user.totalOrders}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-green-600">
                                                {formatCurrency(user.totalSpent)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'active' || !user.status
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.status === 'active' || !user.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-gray-600">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedUser(user);
                                                    }}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                                                >
                                                    Detail
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleUserStatus(user.id, user.status);
                                                    }}
                                                    className={`px-3 py-1 rounded-lg text-sm ${user.status === 'active' || !user.status
                                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                                        : 'bg-green-500 text-white hover:bg-green-600'
                                                        }`}
                                                >
                                                    {user.status === 'active' || !user.status ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Detail Pengguna</h2>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-white hover:text-gray-200 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white text-3xl font-bold">
                                    {selectedUser.full_name?.charAt(0)?.toUpperCase() || selectedUser.email?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">
                                        {selectedUser.full_name || 'Tidak ada nama'}
                                    </h3>
                                    <p className="text-gray-600">{selectedUser.email}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p><span className="font-semibold">User ID:</span> {selectedUser.id}</p>
                                <p><span className="font-semibold">Status:</span>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs ${selectedUser.status === 'active' || !selectedUser.status
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {selectedUser.status === 'active' || !selectedUser.status ? 'Active' : 'Inactive'}
                                    </span>
                                </p>
                                <p><span className="font-semibold">Total Pesanan:</span> {selectedUser.totalOrders}</p>
                                <p><span className="font-semibold">Total Belanja:</span>
                                    <span className="ml-2 text-green-600 font-semibold">
                                        {formatCurrency(selectedUser.totalSpent)}
                                    </span>
                                </p>
                                <p><span className="font-semibold">Tanggal Daftar:</span>
                                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('id-ID') : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;