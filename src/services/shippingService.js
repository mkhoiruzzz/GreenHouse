import api from './api';

export const shippingService = {
  getAllZones: async () => {
    const response = await api.get('/shipping/zones');
    return response.data;
  },

  checkShipping: async (location, productIds = []) => {
    const response = await api.post('/shipping/check', {
      kota: location.kota,
      provinsi: location.provinsi,
      product_ids: productIds,
    });
    return response.data;
  },
};