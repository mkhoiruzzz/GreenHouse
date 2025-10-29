import api from './api';

export const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getUserOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getOrderDetail: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // TAMBAHKAN FUNCTION INI - untuk get order by user ID
  getOrdersByUserId: async (userId) => {
    const response = await api.get(`/orders/user/${userId}`);
    return response.data;
  },

  // TAMBAHKAN FUNCTION INI - untuk get detail order dengan endpoint yang sesuai
  getOrderDetailById: async (orderId) => {
    const response = await api.get(`/orders/detail/${orderId}`);
    return response.data;
  },

  getAllOrders: async (status) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/admin/orders${params}`);
    return response.data;
  },

  updateOrderStatus: async (orderId, statusData) => {
    const response = await api.put(`/admin/orders/${orderId}/status`, statusData);
    return response.data;
  },

  // TAMBAHKAN FUNCTION INI - untuk cancel order
  cancelOrder: async (orderId) => {
    const response = await api.put(`/orders/${orderId}/cancel`);
    return response.data;
  }
};