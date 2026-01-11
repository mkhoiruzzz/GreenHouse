import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { tripayService } from '../services/tripay';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentChannels, setPaymentChannels] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentFee, setPaymentFee] = useState(0);
  const [shippingRates, setShippingRates] = useState([]);
  const [loadingShippingRates, setLoadingShippingRates] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);

  // NEW: User profile and address management
  const [userProfile, setUserProfile] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [formData, setFormData] = useState({
    email: user?.email || '',
    nama_lengkap: '',
    kota: '',
    provinsi: '',
    alamat_pengiriman: '',
    kode_pos: '',
    no_telepon: '',
    metode_pengiriman: '',
    biaya_pengiriman: 0,
    catatan: ''
  });

  // Fetch payment channels
  useEffect(() => {
    const loadPaymentChannels = async () => {
      try {
        const response = await tripayService.getPaymentChannels();
        if (response && response.data) {
          setPaymentChannels(response.data);
        } else {
          setPaymentChannels([]);
        }
      } catch (error) {
        console.error('Error loading payment channels:', error);
        setPaymentChannels([]);
      }
    };
    loadPaymentChannels();
  }, []);

  // Fetch user profile and auto-fill
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setShowAddressForm(true); // No profile, show form
          return;
        }

        if (data) {
          setUserProfile(data);
          setFormData(prev => ({
            ...prev,
            email: user.email || prev.email,
            nama_lengkap: data.full_name || '',
            no_telepon: data.phone || '',
            alamat_pengiriman: data.address || '',
            kota: data.city || '',
            provinsi: data.province || ''
          }));

          // Profile lengkap, hide form
          if (data.full_name && data.address && data.city && data.phone) {
            setShowAddressForm(false);
            // Auto fetch shipping rates
            if (data.city) {
              await fetchShippingRates(data.city);
            }
          } else {
            setShowAddressForm(true);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setShowAddressForm(true);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleInputChange = async (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'kota' && value.trim().length > 2) {
      await fetchShippingRates(value.trim());
    }
  };

  const fetchShippingRates = async (city) => {
    try {
      setLoadingShippingRates(true);
      const { data, error } = await supabase
        .from('shipping_rates')
        .select('*')
        .eq('is_active', true)
        .ilike('city', `%${city}%`)
        .order('cost', { ascending: true });

      if (error) {
        setShippingRates([]);
        return;
      }

      if (data && data.length > 0) {
        setShippingRates(data);
        if (data[0].province) {
          setFormData(prev => ({ ...prev, provinsi: data[0].province }));
        }
      } else {
        setShippingRates([]);
      }
    } catch (error) {
      setShippingRates([]);
    } finally {
      setLoadingShippingRates(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.harga * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + (formData.biaya_pengiriman || 0) + (paymentFee || 0);
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (!formData.nama_lengkap || !formData.alamat_pengiriman || !formData.no_telepon) {
      toast.error('Harap lengkapi informasi pengiriman');
      setShowAddressForm(true);
      return;
    }

    if (!formData.metode_pengiriman || !formData.biaya_pengiriman) {
      toast.error('Pilih metode pengiriman');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Pilih metode pembayaran');
      setShowPaymentModal(true);
      return;
    }

    try {
      setIsSubmitting(true);

      // Create order in Supabase
      const orderData = {
        user_id: user.id,
        total_harga: calculateTotal(),
        biaya_pengiriman: formData.biaya_pengiriman,
        biaya_admin: paymentFee,
        status_pembayaran: 'unpaid',
        status_pengiriman: 'pending',
        metode_pembayaran: `tripay_${selectedPaymentMethod}`,
        alamat_pengiriman: `${formData.alamat_pengiriman}, ${formData.kota} ${formData.kode_pos}`,
        customer_name: formData.nama_lengkap,
        customer_email: formData.email,
        customer_phone: formData.no_telepon,
        kota: formData.kota,
        provinsi: formData.provinsi
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        harga_satuan: item.harga
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update stock
      for (const item of cartItems) {
        const { data: product } = await supabase
          .from('products')
          .select('stok')
          .eq('id', item.id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stok: product.stok - item.quantity })
            .eq('id', item.id);
        }
      }

      // Create Tripay transaction
      const tripayData = {
        method: selectedPaymentMethod,
        merchant_ref: `ORDER-${order.id}`,
        amount: calculateTotal(),
        customer_name: formData.nama_lengkap,
        customer_email: formData.email,
        customer_phone: formData.no_telepon,
        order_items: [
          ...cartItems.map(item => ({
            name: item.nama_produk,
            price: item.harga,
            quantity: item.quantity
          })),
          ...(formData.biaya_pengiriman > 0 ? [{
            name: 'Biaya Pengiriman',
            price: formData.biaya_pengiriman,
            quantity: 1
          }] : []),
          ...(paymentFee > 0 ? [{
            name: 'Biaya Layanan',
            price: paymentFee,
            quantity: 1
          }] : [])
        ],
        callback_url: `https://www.tokotanaman.my.id/api/tripay/webhook`,
        return_url: `https://www.tokotanaman.my.id/order-success`
      };

      const paymentResponse = await tripayService.createTransaction(tripayData);

      if (paymentResponse && paymentResponse.success && paymentResponse.data) {
        // Update order with Tripay reference
        await supabase
          .from('orders')
          .update({ tripay_reference: paymentResponse.data.reference })
          .eq('id', order.id);

        // Clear cart
        clearCart();

        // Redirect to payment (or handle mock checkout_url '#')
        if (paymentResponse.data.checkout_url && paymentResponse.data.checkout_url !== '#') {
          window.location.href = paymentResponse.data.checkout_url;
        } else {
          // If mock or no URL, redirect to success page
          navigate('/order-success');
        }
      } else {
        throw new Error(paymentResponse?.message || 'Gagal membuat transaksi pembayaran');
      }

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Gagal membuat pesanan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen mt-16 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Keranjang Kosong</h2>
          <button
            onClick={() => navigate('/products')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Belanja Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alamat Pengiriman Card (Tokopedia Style) */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>📍</span> Alamat Pengiriman
                </h2>
                {!showAddressForm && userProfile && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Ganti
                  </button>
                )}
              </div>

              {!showAddressForm && formData.nama_lengkap && formData.alamat_pengiriman ? (
                // Display saved address (like Tokopedia)
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-900">{formData.nama_lengkap}</p>
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Utama</span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium mb-1">{formData.no_telepon}</p>
                      <p className="text-sm text-gray-600">
                        {formData.alamat_pengiriman}<br />
                        {formData.kota}, {formData.provinsi} {formData.kode_pos}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Show form for editing
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                      <input
                        type="text"
                        value={formData.nama_lengkap}
                        onChange={(e) => handleInputChange('nama_lengkap', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon *</label>
                      <input
                        type="tel"
                        value={formData.no_telepon}
                        onChange={(e) => handleInputChange('no_telepon', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="08xx"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kota *</label>
                      <input
                        type="text"
                        value={formData.kota}
                        onChange={(e) => handleInputChange('kota', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Contoh: Surabaya"
                        required
                      />
                      {loadingShippingRates && (
                        <p className="text-xs text-blue-600 mt-1">⏳ Men cari tarif ongkir...</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Provinsi</label>
                      <input
                        type="text"
                        value={formData.provinsi}
                        onChange={(e) => handleInputChange('provinsi', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kode Pos</label>
                      <input
                        type="text"
                        value={formData.kode_pos}
                        onChange={(e) => handleInputChange('kode_pos', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Lengkap *</label>
                      <textarea
                        value={formData.alamat_pengiriman}
                        onChange={(e) => handleInputChange('alamat_pengiriman', e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  {!showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(false)}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      ← Kembali
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Product & Shipping Card (Tokopedia Style) */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">✓</span>
                </div>
                <h3 className="font-bold text-gray-900">{user?.email?.split('@')[0] || 'Toko'}</h3>
              </div>

              {/* Product Items */}
              <div className="space-y-4 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.gambar_url}
                      alt={item.nama_produk}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm line-clamp-2">{item.nama_produk}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.quantity} barang</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900">{formatCurrency(item.harga * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Selector (Clickable to open dropdown) */}
              <div className="border-t border-gray-200 pt-4 mb-4 relative">
                <button
                  onClick={() => setShowShippingModal(!showShippingModal)}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-green-500 transition-colors text-left"
                >
                  <div className="flex-1">
                    {formData.metode_pengiriman ? (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Opsi Pengiriman</p>
                        <p className="font-semibold text-gray-900">
                          {shippingRates.find(r => `db_${r.id}` === formData.metode_pengiriman)?.courier ||
                            (['def-1', 'def-2', 'def-3'].includes(formData.metode_pengiriman) ?
                              (formData.metode_pengiriman === 'def-1' ? '📦 Reguler' :
                                formData.metode_pengiriman === 'def-2' ? '💰 Ekonomi' : '⚡ Express') :
                              'Pilih Pengiriman')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(formData.biaya_pengiriman)}
                          {shippingRates.find(r => `db_${r.id}` === formData.metode_pengiriman)?.estimated_days &&
                            ` • ${shippingRates.find(r => `db_${r.id}` === formData.metode_pengiriman)?.estimated_days}`}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500">Pilih Opsi Pengiriman</p>
                        <p className="text-xs text-gray-400">Klik untuk memilih</p>
                      </div>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${showShippingModal ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showShippingModal && (
                  <>
                    {/* Backdrop to close dropdown when clicking outside */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowShippingModal(false)}
                    />

                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
                      {formData.kota.length > 2 ? (
                        <div className="p-3 space-y-2">
                          {(shippingRates.length > 0 ? shippingRates : [
                            { id: 'def-1', courier: '📦 Reguler', cost: 15000, estimated_days: '2-3 hari' },
                            { id: 'def-2', courier: '💰 Ekonomi', cost: 10000, estimated_days: '3-5 hari' },
                            { id: 'def-3', courier: '⚡ Express', cost: 25000, estimated_days: '1-2 hari' }
                          ]).map((option) => {
                            const isFromDB = option.id && !option.id.toString().startsWith('def');
                            const optionValue = isFromDB ? `db_${option.id}` : option.id;
                            const isSelected = formData.metode_pengiriman === optionValue;

                            return (
                              <div
                                key={option.id}
                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${isSelected
                                  ? 'bg-green-50 border-2 border-green-500'
                                  : 'border-2 border-transparent hover:bg-gray-50'
                                  }`}
                                onClick={() => {
                                  handleInputChange('metode_pengiriman', optionValue);
                                  handleInputChange('biaya_pengiriman', parseFloat(option.cost));
                                  setShowShippingModal(false);
                                  toast.success(`${option.courier} dipilih`);
                                }}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900 text-sm">
                                      {option.courier}
                                    </p>
                                    {isFromDB && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                        Khusus {formData.kota}
                                      </span>
                                    )}
                                    {isSelected && (
                                      <span className="text-green-600 ml-auto">✓</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">Estimasi: {option.estimated_days}</p>
                                </div>
                                <p className="font-bold text-green-600 ml-3">{formatCurrency(option.cost)}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <p className="text-sm text-gray-500">Lengkapi alamat untuk melihat opsi pengiriman</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Notes Field */}
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>💬 Kasih Catatan</span>
                  <span className="text-xs text-gray-400">{(formData.catatan || '').length}/200</span>
                </label>
                <textarea
                  value={formData.catatan || ''}
                  onChange={(e) => {
                    if (e.target.value.length <= 200) {
                      handleInputChange('catatan', e.target.value);
                    }
                  }}
                  rows="3"
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Tulis catatan untuk penjual (opsional)"
                />
              </div>
            </div>

          </div>

          {/* RIGHT: Payment & Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 space-y-6">
              {/* Payment Method Section */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Metode Pembayaran</h2>

                {paymentChannels.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPaymentMethod && (
                      <div className="border-2 border-green-500 bg-green-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {paymentChannels.find(c => c.code === selectedPaymentMethod)?.icon_url && (
                              <img
                                src={paymentChannels.find(c => c.code === selectedPaymentMethod)?.icon_url}
                                alt=""
                                className="w-10 h-10 object-contain"
                              />
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {paymentChannels.find(c => c.code === selectedPaymentMethod)?.name || 'Payment'}
                              </p>
                              {paymentFee > 0 && (
                                <p className="text-xs text-gray-600">Biaya: {formatCurrency(paymentFee)}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-green-600 font-bold">✓</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setShowPaymentModal(!showPaymentModal)}
                      className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-sm font-medium text-gray-700"
                    >
                      {showPaymentModal ? '▼' : '+'} Bayar {formatCurrency(calculateTotal())} pakai metode lain
                    </button>

                    {showPaymentModal && (
                      <div className="border border-gray-200 rounded-lg p-3 max-h-96 overflow-y-auto space-y-2">
                        {Object.entries(paymentChannels.reduce((acc, channel) => {
                          const group = channel.group || 'Lainnya';
                          if (!acc[group]) acc[group] = [];
                          acc[group].push(channel);
                          return acc;
                        }, {})).map(([groupName, channels]) => (
                          <div key={groupName} className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase px-2">{groupName}</p>
                            {channels.map((channel) => (
                              <div
                                key={channel.code}
                                onClick={() => {
                                  setSelectedPaymentMethod(channel.code);
                                  setPaymentFee(channel.total_fee?.flat || 0);
                                  setShowPaymentModal(false);
                                  toast.success(`${channel.name} dipilih`);
                                }}
                                className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedPaymentMethod === channel.code
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-100 hover:border-green-300 hover:bg-gray-50'
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  {channel.icon_url && (
                                    <img src={channel.icon_url} alt={channel.name} className="w-10 h-10 object-contain" />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-900">{channel.name}</p>
                                    {channel.total_fee?.flat > 0 && (
                                      <p className="text-xs text-gray-500">Biaya: {formatCurrency(channel.total_fee.flat)}</p>
                                    )}
                                  </div>
                                  {selectedPaymentMethod === channel.code && (
                                    <span className="text-green-600">✓</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Memuat metode pembayaran...</p>
                  </div>
                )}
              </div>

              {/* Summary Section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Ringkasan Belanja</h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Harga ({cartItems.length} barang)</span>
                    <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Ongkir</span>
                    <span className="font-medium">{formatCurrency(formData.biaya_pengiriman || 0)}</span>
                  </div>
                  {paymentFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Biaya Layanan</span>
                      <span className="font-medium">{formatCurrency(paymentFee)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between items-center mb-4">
                  <span className="font-bold text-gray-900">Total Tagihan</span>
                  <span className="font-bold text-green-600 text-xl">{formatCurrency(calculateTotal())}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || !formData.metode_pengiriman || !selectedPaymentMethod}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold transition-colors"
                >
                  {isSubmitting ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;