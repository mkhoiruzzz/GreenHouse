import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../config/supabase'; // ✅ TAMBAHKAN IMPORT

const AdminOrders = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      toast.error('Akses ditolak. Admin only!');
      navigate('/');
      return;
    }
    fetchAllOrders();
  }, [isAuthenticated, isAdmin]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      
      // ❌ HAPUS INI:
      // const response = await fetch('http://localhost:5000/api/admin/orders');
      // const data = await response.json();
      
      // ✅ GANTI DENGAN:
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (
            nama_lengkap,
            email,
            no_telepon
          ),
          order_items (
            *,
            products (
              nama_produk,
              gambar_url,
              icon
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Gagal memuat data pesanan');
        return;
      }

      // Format data untuk compatibility
      const formattedOrders = orders.map(order => ({
        ...order,
        items: order.order_items || [],
        nama_lengkap: order.users?.nama_lengkap,
        email: order.users?.email,
        no_telepon: order.users?.no_telepon
      }));

      setOrders(formattedOrders);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const updateOrderStatus = async (orderId, statusType, newStatus) => {
    try {
      // ❌ HAPUS INI:
      // const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {...});
      
      // ✅ GANTI DENGAN:
      const { data, error } = await supabase
        .from('orders')
        .update({ [statusType]: newStatus })
        .eq('id', orderId)
        .select();

      if (error) {
        console.error('Error updating status:', error);
        toast.error('Gagal update status');
        return;
      }

      toast.success('Status berhasil diupdate!');
      fetchAllOrders(); // Refresh data
      
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  // ... sisa kode tetap sama ...

  const getStatusBadge = (status, type = 'payment') => {
    if (type === 'payment') {
      const badges = {
        pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
        paid: { text: 'Paid', color: 'bg-green-100 text-green-800' },
        cancelled: { text: 'Cancelled', color: 'bg-red-100 text-red-800' }
      };
      return badges[status] || badges.pending;
    } else {
      const badges = {
        pending: { text: 'Pending', color: 'bg-gray-100 text-gray-800' },
        processing: { text: 'Processing', color: 'bg-blue-100 text-blue-800' },
        shipped: { text: 'Shipped', color: 'bg-purple-100 text-purple-800' },
        delivered: { text: 'Delivered', color: 'bg-green-100 text-green-800' },
        cancelled: { text: 'Cancelled', color: 'bg-red-100 text-red-800' }
      };
      return badges[status] || badges.pending;
    }
  };

  // ... sisa kode render tetap sama ...
};

export default AdminOrders;