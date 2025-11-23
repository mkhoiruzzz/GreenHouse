import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  const { t } = useTheme();

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

  // ✅ FIXED: Cek parameter callback dari Tripay DAN clear cart
  useEffect(() => {
    try {
      const reference = searchParams.get('reference');
      const status = searchParams.get('status');

      if (reference) {
        console.log('🔄 Tripay callback detected:', { reference, status });
        setTripayReference(reference);
        checkPaymentStatus(reference);

        if (status === 'success') {
          setPaymentStatus('success');
          setCurrentStep(4);
          // ✅ PENTING: Clear cart setelah payment success dari callback
          console.log('✅ Clearing cart after successful payment callback');
          clearCart();
        }
      }
    } catch (error) {
      console.error('❌ Error in callback effect:', error);
    }
  }, [searchParams, clearCart]);

  // ✅ FIXED: Fungsi cek status pembayaran dengan clear cart
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
          
          // ✅ PENTING: Clear cart setelah payment berhasil
          console.log('✅ Clearing cart after payment verification');
          clearCart();
          
          toast.success(t('Pembayaran berhasil!', 'Payment successful!'));
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
        console.log('🔄 Loading payment channels...');
        const response = await tripayService.getPaymentChannels();

        if (response.success && response.data) {
          setPaymentChannels(response.data);
          console.log('✅ Payment channels loaded:', response.data.length);
        }
      } catch (error) {
        console.error('❌ Error loading payment channels:', error);
        toast.error(t('Gagal memuat metode pembayaran', 'Failed to load payment methods'));
      }
    };

    loadPaymentChannels();
  }, []);

  // Auto-fill form dari user profile
  useEffect(() => {
    if (user) {
      console.log('🔄 Auto-filling form from user');

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
      console.log('🔄 Starting order placement...');

      if (!user) {
        console.error('❌ No user found');
        toast.error(t('Silakan login terlebih dahulu', 'Please login first'));
        navigate('/login');
        return;
      }

      if (!selectedPaymentMethod) {
        console.error('❌ No payment method selected');
        toast.error(t('Pilih metode pembayaran', 'Choose a payment method'));
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

      console.log('📦 Inserting order items:', orderItemsData);

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);

      if (itemsError) {
        console.error('❌ Order items error:', itemsError);
        throw new Error(`Failed to insert order items: ${itemsError.message}`);
      }

      console.log('✅ Order items created');

      // Create payment
      const merchantRef = `ORDER-${order.id}-${Date.now()}`;

      // Include shipping fee in order items for Tripay validation
      const tripayOrderItems = [
        // Product items
        ...cartItems.map(item => ({
          name: item.nama_produk.substring(0, 50),
          price: item.harga,
          quantity: item.quantity
        })),
        // Add shipping fee as separate item
        {
          name: `Biaya Pengiriman (${formData.metode_pengiriman.toUpperCase()})`,
          price: formData.biaya_pengiriman,
          quantity: 1
        }
      ];

      const transactionData = {
        method: selectedPaymentMethod,
        merchant_ref: merchantRef,
        amount: totalAmount,
        customer_name: formData.nama_lengkap,
        customer_email: formData.email,
        customer_phone: formData.no_telepon,
        order_items: tripayOrderItems,
        return_url: `${window.location.origin}/checkout?reference=${merchantRef}&status=success`,
        expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      };

      console.log('💰 Creating payment transaction...');
      console.log('Transaction data:', {
        method: transactionData.method,
        amount: transactionData.amount,
        itemsCount: transactionData.order_items.length
      });

      // Validate: order_items total must equal amount
      const itemsTotal = transactionData.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      console.log('💰 Validation:', {
        itemsTotal: itemsTotal,
        amount: transactionData.amount,
        match: itemsTotal === transactionData.amount
      });

      if (itemsTotal !== transactionData.amount) {
        console.error('❌ Amount mismatch!', { itemsTotal, amount: transactionData.amount });
        throw new Error(`Amount validation failed: items=${itemsTotal}, amount=${transactionData.amount}`);
      }

      const tripayPayment = await tripayService.createTransaction(transactionData);

      console.log('🔥 Tripay response:', tripayPayment);

      if (!tripayPayment || !tripayPayment.success) {
        console.error('❌ Payment creation failed:', tripayPayment);
        throw new Error(tripayPayment?.message || t('Gagal membuat pembayaran', 'Failed to create payment'));
      }

      console.log('✅ Payment created successfully');

      // Update order with payment reference
      console.log('📝 Updating order with payment reference...');

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          tripay_reference: tripayPayment.data.reference,
          tripay_checkout_url: tripayPayment.data.checkout_url || '#'
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('⚠️ Warning: Failed to update order with payment reference:', updateError);
        // Don't throw - continue with order
      }

      console.log('🎉 Order placement completed successfully!');

      // ✅ PENTING: Clear cart SEBELUM redirect (untuk mock payment)
      if (tripayPayment.data.checkout_url && tripayPayment.data.checkout_url !== '#') {
        console.log('🚀 Redirecting to payment page:', tripayPayment.data.checkout_url);
        // Clear cart sebelum redirect ke Tripay
        clearCart();
        window.location.href = tripayPayment.data.checkout_url;
      } else {
        // Mock payment - langsung success
        console.log('✅ Mock payment - showing success page');
        setOrderId(order.id);
        setTripayReference(tripayPayment.data.reference);
        setPaymentStatus('success');
        setCurrentStep(4);
        // Clear cart untuk mock payment
        clearCart();
        toast.success(t('Pembayaran berhasil!', 'Payment successful!'));
      }

    } catch (error) {
      console.error('❌ ERROR in handlePlaceOrder:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      toast.error(error.message || t('Terjadi kesalahan saat membuat pesanan', 'An error occurred while creating the order'));
    } finally {
      console.log('🔄 Resetting loading states');
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
        toast.error(t('Harap lengkapi informasi pembeli', 'Please complete buyer information'));
        return;
      }
    }

    if (currentStep === 2 && !formData.metode_pengiriman) {
      toast.error(t('Pilih metode pengiriman', 'Select a shipping method'));
      return;
    }

    if (currentStep === 3 && !selectedPaymentMethod) {
      toast.error(t('Pilih metode pembayaran', 'Select a payment method'));
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
      <div className="min-h-screen mt-16 flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('Keranjang Kosong','Cart is empty')}</h2>
          <button
            onClick={() => navigate('/products')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            {t('Belanja Sekarang','Shop Now')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-16 bg-gray-50 dark:bg-gray-900 py-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {currentStep === 4 ? t('Pembayaran Selesai','Payment Complete') : t('Pembayaran','Payment')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {currentStep === 4 
              ? t('Terima kasih telah berbelanja','Thank you for shopping with us')
              : t('Selesaikan pembelian dalam 3 langkah mudah','Complete your purchase in 3 easy steps')
            }
          </p>
        </div>

        {/* Progress Steps */}
        {currentStep < 4 && (
          <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg shadow p-4 mb-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : 'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                  } font-semibold`}>
                    {step}
                  </div>
                  <span className={`ml-2 font-medium ${
                    currentStep >= step ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step === 1 ? t('Info Pembeli','Buyer Info') : step === 2 ? t('Pengiriman','Shipping') : t('Pembayaran','Payment')}
                  </span>
                  {index < 2 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'
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
              <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg shadow p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('Informasi Pembeli','Buyer Information')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">{t('Email','Email')}</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">{t('Nama Lengkap','Full Name')}</label>
                    <input
                      type="text"
                      value={formData.nama_lengkap}
                      onChange={(e) => handleInputChange('nama_lengkap', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">{t('No. Telepon','Phone')}</label>
                    <input
                      type="tel"
                      value={formData.no_telepon}
                      onChange={(e) => handleInputChange('no_telepon', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">{t('Kota','City')}</label>
                    <input
                      type="text"
                      value={formData.kota}
                      onChange={(e) => handleInputChange('kota', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">{t('Alamat Pengiriman','Shipping Address')}</label>
                    <textarea
                      value={formData.alamat_pengiriman}
                      onChange={(e) => handleInputChange('alamat_pengiriman', e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">{t('Kode Pos','Postal Code')}</label>
                    <input
                      type="text"
                      value={formData.kode_pos}
                      onChange={(e) => handleInputChange('kode_pos', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Metode Pengiriman */}
            {currentStep === 2 && (
              <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg shadow p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('Metode Pengiriman','Shipping Method')}</h2>
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
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
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
                          <p className="font-medium text-gray-900 dark:text-gray-200">{option.label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('Estimasi','Estimate')}: {option.estimate}</p>
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
              <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg shadow p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('Metode Pembayaran','Payment Method')}</h2>
                {paymentChannels.length > 0 ? (
                  <PaymentMethodAccordion 
                    channels={paymentChannels}
                    selectedMethod={selectedPaymentMethod}
                    onSelectMethod={setSelectedPaymentMethod}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">{t('Memuat metode pembayaran...','Loading payment methods...')}</p>
                  </div>
                )}

                {/* Info Tripay */}
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2 text-lg">🔒</span>
                    <div>
                      <p className="text-blue-900 dark:text-blue-200 font-semibold text-sm mb-1">
                        {t('Pembayaran Aman dengan Tripay','Secure Payments with Tripay')}
                      </p>
                      <p className="text-blue-700 dark:text-blue-100 text-xs">
                        {t('Payment Gateway resmi dan terpercaya di Indonesia','Official and trusted payment gateway in Indonesia')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Success */}
            {currentStep === 4 && paymentStatus === 'success' && (
              <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg shadow p-6 text-center transition-colors duration-300">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">{t('Pembayaran Berhasil!','Payment Successful!')}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-2">{t('Order ID','Order ID')}: <strong>#{orderId}</strong></p>
                {tripayReference && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{t('Reference','Reference')}: <strong>{tripayReference}</strong></p>
                )}
                <div className="flex gap-4 justify-center mt-6 flex-wrap">
                  <button
                    onClick={() => navigate('/orders')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                  >
                    {t('Lihat Pesanan','View Orders')}
                  </button>
                  <button
                    onClick={() => navigate('/products')}
                    className="border border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10"
                  >
                    {t('Lanjut Belanja','Continue Shopping')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary - only show in steps 1-3 */}
          {currentStep < 4 && (
            <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg shadow p-6 h-fit transition-colors duration-300">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('Ringkasan Pesanan','Order Summary')}</h2>
              <div className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{item.nama_produk}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(item.harga)} × {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{formatCurrency(item.harga * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2 border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>{t('Subtotal','Subtotal')}</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>{t('Biaya Pengiriman','Shipping')}</span>
                  <span>{formatCurrency(formData.biaya_pengiriman)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100">
                  <span>{t('Total','Total')}</span>
                  <span className="text-green-600 dark:text-green-400">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-lg hover:bg-gray-200"
                  >
                    {t('Kembali','Back')}
                  </button>
                )}
                <button
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700"
                >
                  {isSubmitting ? t('Memproses...','Processing...') : currentStep === 3 ? t('Buat Pesanan','Place Order') : t('Lanjutkan','Continue')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Payment Method Accordion Component
const PaymentMethodAccordion = ({ channels, selectedMethod, onSelectMethod }) => {
  const [openCategories, setOpenCategories] = React.useState({
    'Virtual Account': true,
    'E-Wallet': false,
    'Convenience Store': false,
    'QR Code': false
  });

  // Group channels by category
  const groupedChannels = channels.reduce((acc, channel) => {
    const category = channel.group || 'Lainnya';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(channel);
    return acc;
  }, {});

  const toggleCategory = (category) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Virtual Account': '🏦',
      'E-Wallet': '📱',
      'Convenience Store': '🏪',
      'QR Code': '📲',
      'Lainnya': '💳'
    };
    return icons[category] || '💳';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Virtual Account': 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
      'E-Wallet': 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800',
      'Convenience Store': 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800',
      'QR Code': 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
      'Lainnya': 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    };
    return colors[category] || 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  };

  return (
    <div className="space-y-3">
      {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
        <div 
          key={category} 
          className={`border rounded-lg overflow-hidden ${getCategoryColor(category)}`}>
          {/* Category Header - Clickable */}
          <button
            type="button"
            onClick={() => toggleCategory(category)}
            className="w-full flex items-center justify-between p-4 hover:bg-opacity-70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getCategoryIcon(category)}</span>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{category}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">{categoryChannels.length} metode tersedia</p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                openCategories[category] ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Category Content - Collapsible */}
          {openCategories[category] && (
            <div className="px-2 pb-2 space-y-2">
              {categoryChannels.map((channel) => (
                <div
                  key={channel.code}
                  className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedMethod === channel.code
                      ? 'border-green-500 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                  }`}
                  onClick={() => onSelectMethod(channel.code)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="radio"
                      checked={selectedMethod === channel.code}
                      onChange={() => {}}
                      className="w-4 h-4 text-green-600"
                    />

                    {/* Payment Icon */}
                    <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 flex-shrink-0">
                      {channel.icon_url ? (
                        <img
                          src={channel.icon_url}
                          alt={channel.name}
                          className="max-w-full max-h-full object-contain p-1"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<span class="text-xl">💳</span>';
                          }}
                        />
                      ) : (
                        <span className="text-xl">💳</span>
                      )}
                    </div>

                    {/* Payment Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{channel.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{channel.group}</p>
                    </div>
                  </div>

                  {/* Fee Display */}
                  <div className="text-right ml-3 flex-shrink-0 text-sm">
                    {channel.total_fee?.flat > 0 && (
                      <p className="text-xs font-semibold text-green-600">+{formatCurrency(channel.total_fee.flat)}</p>
                    )}
                    {channel.total_fee?.percent > 0 && (
                      <p className="text-xs font-semibold text-green-600">+{channel.total_fee.percent}%</p>
                    )}
                    {!channel.total_fee?.flat && !channel.total_fee?.percent && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">{/* Gratis */}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Checkout;