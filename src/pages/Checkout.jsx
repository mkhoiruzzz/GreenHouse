// Checkout.jsx - FULL WORKING VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { tripayService } from '../services/tripay';

const Checkout = () => {
  console.log('🚀 Checkout component mounting...');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [orderId, setOrderId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentChannels, setPaymentChannels] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [tripayReference, setTripayReference] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    subscribe_newsletter: false,
    nama_lengkap: '',
    kota: '',
    alamat_pengiriman: '',
    kode_pos: '',
    no_telepon: '',
    metode_pengiriman: '',
    biaya_pengiriman: 15000,
    metode_pembayaran: 'tripay',
    kode_kupon: ''
  });

  // Log initial state
  useEffect(() => {
    console.log('📊 Initial State:', {
      user: user?.email,
      cartItemsCount: cartItems?.length,
      environment: import.meta.env.MODE
    });
  }, []);

  // Cek parameter callback dari Tripay
  useEffect(() => {
    try {
      const reference = searchParams.get('reference');
      const status = searchParams.get('status');
      
      if (reference) {
        console.log('📄 Tripay callback detected:', { reference, status });
        setTripayReference(reference);
        checkPaymentStatus(reference);
        
        if (status === 'success') {
          setPaymentStatus('success');
          setCurrentStep(4);
        }
      }
    } catch (error) {
      console.error('❌ Error in callback effect:', error);
    }
  }, [searchParams]);

  // Fungsi cek status pembayaran
  const checkPaymentStatus = async (reference) => {
    try {
      console.log('🔍 Checking payment status for:', reference);
      
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('tripay_reference', reference)
        .single();

      if (error) {
        console.error('❌ Error fetching order:', error);
        return;
      }

      if (order) {
        console.log('📦 Order found:', order);
        
        if (order.status_pembayaran === 'paid') {
          setPaymentStatus('success');
          setOrderId(order.id);
          setCurrentStep(4);
          await updateProductStockAfterPayment(order.id);
          toast.success('Pembayaran berhasil!');
        }
      }
    } catch (error) {
      console.error('❌ Error checking payment status:', error);
    }
  };

  // Load payment channels
  useEffect(() => {
    const loadPaymentChannels = async () => {
      try {
        console.log('📄 Loading payment channels...');
        const response = await tripayService.getPaymentChannels();
        
        if (response.success && response.data) {
          setPaymentChannels(response.data);
          console.log('✅ Payment channels loaded:', response.data.length);
        }
      } catch (error) {
        console.error('❌ Error loading payment channels:', error);
        toast.error('Gagal memuat metode pembayaran');
      }
    };

    loadPaymentChannels();
  }, []);

  // Auto-fill form dari user profile
  useEffect(() => {
    if (user) {
      console.log('📄 Auto-filling form from user');
      
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        nama_lengkap: user.user_metadata?.full_name || '',
        kota: user.user_metadata?.city || '',
        alamat_pengiriman: user.user_metadata?.address || '',
        kode_pos: user.user_metadata?.postal_code || '',
        no_telepon: user.user_metadata?.phone || ''
      }));
    }
  }, [user]);

  const formatOrderItems = () => {
    return cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      harga_satuan: item.harga
    }));
  };

  const updateProductStockAfterPayment = async (orderId) => {
    try {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      for (const item of orderItems || []) {
        const { data: product } = await supabase
          .from('products')
          .select('stok')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stok: product.stok - item.quantity })
            .eq('id', item.product_id);
        }
      }
    } catch (error) {
      console.error('❌ Error updating stock:', error);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      setIsSubmitting(true);
      console.log('📄 Starting order placement...');

      if (!user) {
        console.error('❌ No user found');
        toast.error('Silakan login terlebih dahulu');
        navigate('/login');
        return;
      }

      if (!selectedPaymentMethod) {
        console.error('❌ No payment method selected');
        toast.error('Pilih metode pembayaran');
        return;
      }

      console.log('👤 User ID:', user.id);
      console.log('💳 Payment method:', selectedPaymentMethod);

      const orderItems = formatOrderItems();
      const totalHarga = calculateSubtotal();
      const totalAmount = calculateTotal();

      console.log('💰 Order totals:', {
        subtotal: totalHarga,
        shipping: formData.biaya_pengiriman,
        total: totalAmount,
        items: orderItems.length
      });

      // Create order in database
      const orderData = {
        user_id: user.id,
        total_harga: totalHarga,
        biaya_pengiriman: formData.biaya_pengiriman,
        status_pembayaran: 'unpaid',
        status_pengiriman: 'pending',
        metode_pembayaran: `tripay_${selectedPaymentMethod}`,
        alamat_pengiriman: `${formData.alamat_pengiriman}, ${formData.kota} ${formData.kode_pos}`,
        customer_name: formData.nama_lengkap,
        customer_email: formData.email,
        customer_phone: formData.no_telepon,
        created_at: new Date().toISOString()
      };

      console.log('📝 Creating order with data:', orderData);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error('❌ Database error:', orderError);
        throw new Error(`Database error: ${orderError.message}`);
      }

      if (!order) {
        console.error('❌ No order returned from database');
        throw new Error('Failed to create order - no data returned');
      }

      console.log('✅ Order created in database:', order.id);

      // Insert order items
      const orderItemsData = orderItems.map(item => ({
        ...item,
        order_id: order.id
      }));

      await supabase.from('order_items').insert(orderItemsData);

      // Create payment
      const merchantRef = `ORDER-${order.id}-${Date.now()}`;
      
      const transactionData = {
        method: selectedPaymentMethod,
        merchant_ref: merchantRef,
        amount: totalAmount,
        customer_name: formData.nama_lengkap,
        customer_email: formData.email,
        customer_phone: formData.no_telepon,
        order_items: cartItems.map(item => ({
          name: item.nama_produk.substring(0, 50),
          price: item.harga,
          quantity: item.quantity
        })),
        return_url: `${window.location.origin}/checkout?reference=${merchantRef}&status=success`,
        expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      };

      const tripayPayment = await tripayService.createTransaction(transactionData);
      
      if (!tripayPayment.success) {
        throw new Error(tripayPayment.message || 'Gagal membuat pembayaran');
      }

      // Update order with payment reference
      await supabase
        .from('orders')
        .update({
          tripay_reference: tripayPayment.data.reference,
          tripay_checkout_url: tripayPayment.data.checkout_url
        })
        .eq('id', order.id);

      console.log('✅ Payment created');
      
      // Redirect or show success
      if (tripayPayment.data.checkout_url && tripayPayment.data.checkout_url !== '#') {
        window.location.href = tripayPayment.data.checkout_url;
      } else {
        setOrderId(order.id);
        setTripayReference(tripayPayment.data.reference);
        setPaymentStatus('success');
        setCurrentStep(4);
        clearCart();
        toast.success('Pembayaran berhasil!');
      }

    } catch (error) {
      console.error('❌ Error:', error);
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    console.log('➡️ Moving to next step. Current:', currentStep);
    
    if (currentStep === 1) {
      if (!formData.nama_lengkap || !formData.alamat_pengiriman || !formData.no_telepon) {
        toast.error('Harap lengkapi informasi pembeli');
        return;
      }
    }
    
    if (currentStep === 2 && !formData.metode_pengiriman) {
      toast.error('Pilih metode pengiriman');
      return;
    }
    
    if (currentStep === 3 && !selectedPaymentMethod) {
      toast.error('Pilih metode pembayaran');
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handlePlaceOrder();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1 && currentStep < 4) {
      console.log('⬅️ Moving to previous step');
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.harga * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + (formData.biaya_pengiriman || 0);
  };

  // Empty cart check
  if (!cartItems || cartItems.length === 0 && currentStep !== 4) {
    return (
      <div className="min-h-screen mt-16 flex items-center justify-center">
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
    <div className="min-h-screen mt-16 bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStep === 4 ? 'Pembayaran Selesai' : 'Checkout'}
          </h1>
          <p className="text-gray-600">
            {currentStep === 4 
              ? 'Terima kasih telah berbelanja' 
              : 'Selesaikan pembelian dalam 3 langkah mudah'
            }
          </p>
        </div>

        {/* Progress Steps */}
        {currentStep < 4 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : 'border-gray-300 text-gray-500'
                  } font-semibold`}>
                    {step}
                  </div>
                  <span className={`ml-2 font-medium ${
                    currentStep >= step ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step === 1 ? 'Info Pembeli' : step === 2 ? 'Pengiriman' : 'Pembayaran'}
                  </span>
                  {index < 2 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={currentStep === 4 ? 'lg:col-span-3' : 'lg:col-span-2'}>
            {/* STEP 1: Info Pembeli */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Informasi Pembeli</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
                    <input
                      type="text"
                      value={formData.nama_lengkap}
                      onChange={(e) => handleInputChange('nama_lengkap', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">No. Telepon</label>
                    <input
                      type="tel"
                      value={formData.no_telepon}
                      onChange={(e) => handleInputChange('no_telepon', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Kota</label>
                    <input
                      type="text"
                      value={formData.kota}
                      onChange={(e) => handleInputChange('kota', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Alamat Pengiriman</label>
                    <textarea
                      value={formData.alamat_pengiriman}
                      onChange={(e) => handleInputChange('alamat_pengiriman', e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Kode Pos</label>
                    <input
                      type="text"
                      value={formData.kode_pos}
                      onChange={(e) => handleInputChange('kode_pos', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Metode Pengiriman */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Metode Pengiriman</h2>
                <div className="space-y-3">
                  {[
                    { value: 'jne', label: 'JNE Reguler', cost: 15000, estimate: '2-3 hari' },
                    { value: 'jne_oke', label: 'JNE OKE', cost: 12000, estimate: '3-5 hari' },
                    { value: 'tiki', label: 'TIKI Reguler', cost: 18000, estimate: '1-2 hari' },
                    { value: 'pos', label: 'POS Indonesia', cost: 10000, estimate: '4-7 hari' }
                  ].map((option) => (
                    <div 
                      key={option.value}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                        formData.metode_pengiriman === option.value 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => {
                        handleInputChange('metode_pengiriman', option.value);
                        handleInputChange('biaya_pengiriman', option.cost);
                      }}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          checked={formData.metode_pengiriman === option.value}
                          onChange={() => {}}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-gray-500">Estimasi: {option.estimate}</p>
                        </div>
                      </div>
                      <p className="font-semibold">{formatCurrency(option.cost)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Metode Pembayaran */}
            {currentStep === 3 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Metode Pembayaran</h2>
                {paymentChannels.length > 0 ? (
                  <div className="space-y-2">
                    {paymentChannels.map((channel) => (
                      <div 
                        key={channel.code}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                          selectedPaymentMethod === channel.code 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedPaymentMethod(channel.code)}
                      >
                        <div className="flex items-center flex-1">
                          <input
                            type="radio"
                            checked={selectedPaymentMethod === channel.code}
                            onChange={() => {}}
                            className="mr-3"
                          />
                          <div>
                            <p className="font-medium">{channel.name}</p>
                            <p className="text-xs text-gray-500">{channel.group}</p>
                          </div>
                        </div>
                        {channel.total_fee?.flat > 0 && (
                          <p className="text-xs text-green-600">
                            +{formatCurrency(channel.total_fee.flat)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat metode pembayaran...</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Success */}
            {currentStep === 4 && paymentStatus === 'success' && (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-green-600 mb-4">Pembayaran Berhasil!</h2>
                <p className="text-gray-600 mb-2">Order ID: <strong>#{orderId}</strong></p>
                {tripayReference && (
                  <p className="text-gray-600 mb-4">Reference: <strong>{tripayReference}</strong></p>
                )}
                <div className="flex gap-4 justify-center mt-6">
                  <button
                    onClick={() => navigate('/orders')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                  >
                    Lihat Pesanan
                  </button>
                  <button
                    onClick={() => navigate('/products')}
                    className="border border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50"
                  >
                    Lanjut Belanja
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary - only show in steps 1-3 */}
          {currentStep < 4 && (
            <div className="bg-white rounded-lg shadow p-6 h-fit">
              <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.nama_produk}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(item.harga)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">
                      {formatCurrency(item.harga * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Biaya Pengiriman</span>
                  <span>{formatCurrency(formData.biaya_pengiriman)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200"
                  >
                    Kembali
                  </button>
                )}
                <button
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700"
                >
                  {isSubmitting ? 'Memproses...' : currentStep === 3 ? 'Buat Pesanan' : 'Lanjutkan'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;