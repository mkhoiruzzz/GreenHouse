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
  const [paymentFee, setPaymentFee] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [tripayReference, setTripayReference] = useState('');
  
  // 🆕 NEW: Simpan order summary sebelum clear cart
  const [orderSummary, setOrderSummary] = useState(() => {
    // Try to load from sessionStorage first (for page refresh)
    const saved = sessionStorage.getItem('checkout_order_summary');
    return saved ? JSON.parse(saved) : null;
  });

  const [formData, setFormData] = useState({
    email: '',
    subscribe_newsletter: false,
    nama_lengkap: '',
    kota: '',
    alamat_pengiriman: '',
    kode_pos: '',
    no_telepon: '',
    metode_pengiriman: '',
    biaya_pengiriman: 0,
    metode_pembayaran: 'tripay',
    kode_kupon: ''
  });

  // Log initial state
  useEffect(() => {
    console.log('📊 Initial State:', {
      user: user?.email,
      cartItemsCount: cartItems?.length,
      hasOrderSummary: !!orderSummary,
      environment: import.meta.env.MODE
    });
  }, []);

  // ✅ FIXED: Cek parameter callback dari Tripay
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const reference = searchParams.get('reference');
        const status = searchParams.get('status');
        const tripayRef = searchParams.get('tripay_reference');

        if (reference || tripayRef) {
          const finalReference = reference || tripayRef;
          console.log('🔄 Tripay callback detected:', { reference: finalReference, status });
          setTripayReference(finalReference);
          
          // Load order summary from sessionStorage
          const savedSummary = sessionStorage.getItem('checkout_order_summary');
          if (savedSummary) {
            const summary = JSON.parse(savedSummary);
            setOrderSummary(summary);
            setFormData(prev => ({
              ...prev,
              biaya_pengiriman: summary.biaya_pengiriman,
              metode_pengiriman: summary.metode_pengiriman
            }));
            setPaymentFee(summary.biaya_admin || 0);
            console.log('✅ Order summary restored from session:', summary);
          }
          
          // Tunggu checkPaymentStatus selesai
          await checkPaymentStatus(finalReference);

          if (status === 'success') {
            setPaymentStatus('success');
            setCurrentStep(4);
            // Clear cart setelah payment success
            clearCart();
            // Clear order summary dari session
            sessionStorage.removeItem('checkout_order_summary');
          }
        }
      } catch (error) {
        console.error('❌ Error in callback effect:', error);
      }
    };

    handleCallback();
  }, [searchParams]);

  // ✅ Fungsi cek status pembayaran
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
          
          // Restore order summary dari order data
          if (!orderSummary) {
            setOrderSummary({
              subtotal: order.total_harga,
              biaya_pengiriman: order.biaya_pengiriman,
              biaya_admin: order.biaya_admin || 0,
              total: order.total_harga + order.biaya_pengiriman + (order.biaya_admin || 0),
              metode_pengiriman: order.metode_pembayaran?.split('_')[0] || 'jne'
            });
          }
          
          await updateProductStockAfterPayment(order.id);
          clearCart();
          sessionStorage.removeItem('checkout_order_summary');
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
        paymentFee: paymentFee,
        total: totalAmount,
        items: orderItems.length
      });

      // 🆕 NEW: Simpan order summary SEBELUM apapun
      const summary = {
        subtotal: totalHarga,
        biaya_pengiriman: formData.biaya_pengiriman,
        biaya_admin: paymentFee,
        total: totalAmount,
        metode_pengiriman: formData.metode_pengiriman,
        timestamp: new Date().toISOString()
      };
      
      setOrderSummary(summary);
      sessionStorage.setItem('checkout_order_summary', JSON.stringify(summary));
      console.log('💾 Order summary saved:', summary);

      // Create order in database
      const orderData = {
        user_id: user.id,
        total_harga: totalHarga,
        biaya_pengiriman: formData.biaya_pengiriman,
        biaya_admin: paymentFee,
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

      const tripayOrderItems = [
        ...cartItems.map(item => ({
          name: item.nama_produk.substring(0, 50),
          price: item.harga,
          quantity: item.quantity
        })),
        {
          name: `Biaya Pengiriman (${formData.metode_pengiriman.toUpperCase()})`,
          price: formData.biaya_pengiriman,
          quantity: 1
        }
      ];

      if (paymentFee > 0) {
        tripayOrderItems.push({
          name: `Biaya Admin Pembayaran`,
          price: paymentFee,
          quantity: 1
        });
      }

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
      }

      console.log('🎉 Order placement completed successfully!');

      // ✅ FIXED: Jangan clear cart di sini untuk production
      if (tripayPayment.data.checkout_url && tripayPayment.data.checkout_url !== '#') {
        console.log('🚀 Redirecting to payment page:', tripayPayment.data.checkout_url);
        // JANGAN clear cart - biarkan callback yang handle
        window.location.href = tripayPayment.data.checkout_url;
      } else {
        // Mock payment - langsung success
        console.log('✅ Mock payment - showing success page');
        setOrderId(order.id);
        setTripayReference(tripayPayment.data.reference);
        setPaymentStatus('success');
        setCurrentStep(4);
        clearCart();
        sessionStorage.removeItem('checkout_order_summary');
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

    if (currentStep === 2) {
      if (!formData.metode_pengiriman) {
        toast.error(t('Pilih metode pengiriman', 'Select a shipping method'));
        return;
      }
      if (formData.biaya_pengiriman <= 0) {
        toast.error(t('Biaya pengiriman tidak valid', 'Invalid shipping cost'));
        return;
      }
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
    // Use orderSummary if available (for success page after payment)
    if (orderSummary && currentStep === 4) {
      return orderSummary.subtotal;
    }
    return cartItems.reduce((total, item) => total + (item.harga * item.quantity), 0);
  };

  const calculateTotal = () => {
    // Use orderSummary if available (for success page after payment)
    if (orderSummary && currentStep === 4) {
      return orderSummary.total;
    }
    
    const subtotal = calculateSubtotal();
    const shipping = formData.biaya_pengiriman > 0 ? formData.biaya_pengiriman : 0;
    const fee = paymentFee > 0 ? paymentFee : 0;
    return subtotal + shipping + fee;
  };

  // Empty cart check - SKIP if we have orderSummary (callback scenario)
  if ((!cartItems || cartItems.length === 0) && currentStep !== 4 && !orderSummary) {
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
        {/* ... Rest of the component stays the same ... */}
        {/* Just showing the success page part that uses orderSummary */}
        
        {currentStep === 4 && paymentStatus === 'success' && (
          <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg shadow p-6 text-center transition-colors duration-300">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">{t('Pembayaran Berhasil!','Payment Successful!')}</h2>
            {orderId ? (
              <p className="text-gray-600 dark:text-gray-300 mb-2">{t('Order ID','Order ID')}: <strong>#{orderId}</strong></p>
            ) : (
              <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm italic">{t('Memuat Order ID...','Loading Order ID...')}</p>
            )}
            {tripayReference && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">{t('Reference','Reference')}: <strong>{tripayReference}</strong></p>
            )}
            
            {/* ✅ Order Summary - uses orderSummary state */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-6 mb-6 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-center">{t('Ringkasan Pembayaran','Payment Summary')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('Subtotal Produk','Products Subtotal')}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(orderSummary?.subtotal || calculateSubtotal())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('Biaya Pengiriman','Shipping')}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(orderSummary?.biaya_pengiriman || formData.biaya_pengiriman)}
                  </span>
                </div>
                {(orderSummary?.biaya_admin || paymentFee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('Biaya Admin','Admin Fee')}</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {formatCurrency(orderSummary?.biaya_admin || paymentFee)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-base">
                    <span className="text-gray-900 dark:text-gray-100">{t('Total Dibayar','Total Paid')}</span>
                    <span className="text-green-600 dark:text-green-400 text-lg">
                      {formatCurrency(orderSummary?.total || calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center mt-6 flex-wrap">
              <button
                onClick={() => navigate('/orders')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors"
              >
                📦 {t('Lihat Pesanan','View Orders')}
              </button>
              <button
                onClick={() => navigate('/products')}
                className="border border-green-600 text-green-600 dark:text-green-400 dark:border-green-500 px-6 py-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10 font-semibold transition-colors"
              >
                🛍️ {t('Lanjut Belanja','Continue Shopping')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// Payment Method Accordion Component
const PaymentMethodAccordion = ({ channels, selectedMethod, onSelectMethod, onFeeChange }) => {
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

  // ✅ NEW: Calculate fee for a channel
  const calculateChannelFee = (channel) => {
    const flatFee = channel.total_fee?.flat || 0;
    const percentFee = channel.total_fee?.percent || 0;
    return { flat: flatFee, percent: percentFee };
  };

  // ✅ NEW: Handle payment method selection with fee
  const handleSelectMethod = (channel) => {
    const fee = calculateChannelFee(channel);
    const totalFee = fee.flat; // For now, we'll use flat fee
    
    onSelectMethod(channel.code);
    onFeeChange(totalFee);
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
              {categoryChannels.map((channel) => {
                const fee = calculateChannelFee(channel);
                
                return (
                  <div
                    key={channel.code}
                    className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedMethod === channel.code
                        ? 'border-green-500 shadow-md bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                    }`}
                    onClick={() => handleSelectMethod(channel)}
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

                    {/* ✅ UPDATED: Fee Display with better styling */}
                    <div className="text-right ml-3 flex-shrink-0">
                      {fee.flat > 0 || fee.percent > 0 ? (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded px-2 py-1">
                          {fee.flat > 0 && (
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                              +{formatCurrency(fee.flat)}
                            </p>
                          )}
                          {fee.percent > 0 && (
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                              +{fee.percent}%
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded px-2 py-1">
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400">Gratis</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Checkout;