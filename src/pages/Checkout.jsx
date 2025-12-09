import React, { useState, useEffect, useRef } from 'react'; // ✅ Added useRef
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
  
  // ✅ NEW: State untuk menyimpan ringkasan order sebelum cart dikosongkan
  const [orderSummary, setOrderSummary] = useState(null);
  const [tempCartItems, setTempCartItems] = useState([]); // ✅ Menyimpan cart items sementara
  const hasClearedCartRef = useRef(false); // ✅ Mencegah multiple clear cart

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
          
          // Tunggu checkPaymentStatus selesai
          await checkPaymentStatus(finalReference);
        }
      } catch (error) {
        console.error('❌ Error in callback effect:', error);
      }
    };

    handleCallback();
  }, [searchParams]);

  // ✅ FIXED: Fungsi cek status pembayaran
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
          // ✅ Stok sudah dikurangi saat order dibuat, tidak perlu dikurangi lagi
          
          // ✅ Simpan ringkasan order sebelum clear cart
          saveOrderSummary();
          
          // ✅ Clear cart dengan flag untuk mencegah duplikasi
          if (!hasClearedCartRef.current) {
            hasClearedCartRef.current = true;
            clearCart();
          }
          
          toast.success(t('Pembayaran berhasil!', 'Payment successful!'));
        }
      }
    } catch (error) {
      console.error('❌ Error checking payment status:', error);
    }
  };

  // ✅ NEW: Simpan ringkasan order
  const saveOrderSummary = () => {
    const summary = {
      subtotal: calculateSubtotal(),
      shipping: formData.biaya_pengiriman,
      paymentFee: paymentFee,
      total: calculateTotal(),
      items: [...cartItems], // Salinan cart items
      timestamp: new Date().toISOString()
    };
    
    setOrderSummary(summary);
    // Simpan juga ke sessionStorage sebagai backup
    sessionStorage.setItem('lastOrderSummary', JSON.stringify(summary));
    
    // Simpan cart items sementara
    setTempCartItems([...cartItems]);
  };

  // ✅ NEW: Load order summary dari storage jika ada
  useEffect(() => {
    const savedSummary = sessionStorage.getItem('lastOrderSummary');
    if (savedSummary && currentStep === 4) {
      try {
        const parsed = JSON.parse(savedSummary);
        setOrderSummary(parsed);
      } catch (e) {
        console.error('❌ Error parsing saved order summary:', e);
      }
    }
  }, [currentStep]);

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

  // Auto-fill form dari user profile - DISABLED (user harus mengisi sendiri)
  // useEffect(() => {
  //   if (user) {
  //     console.log('🔄 Auto-filling form from user');

  //     setFormData(prev => ({
  //       ...prev,
  //       email: user.email || '',
  //       nama_lengkap: user.user_metadata?.full_name || '',
  //       kota: user.user_metadata?.city || '',
  //       alamat_pengiriman: user.user_metadata?.address || '',
  //       kode_pos: user.user_metadata?.postal_code || '',
  //       no_telepon: user.user_metadata?.phone || ''
  //     }));
  //   }
  // }, [user]);

  const formatOrderItems = () => {
    return cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      harga_satuan: item.harga
    }));
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

      // ✅ Simpan ringkasan order SEBELUM clear cart
      saveOrderSummary();

      // Create order in database
      const orderData = {
        user_id: user.id,
        total_harga: totalHarga,
        biaya_pengiriman: formData.biaya_pengiriman || 0,
        biaya_admin: paymentFee || 0,
        status_pembayaran: 'unpaid',
        status_pengiriman: 'pending',
        metode_pembayaran: `tripay_${selectedPaymentMethod}`,
        alamat_pengiriman: `${formData.alamat_pengiriman}, ${formData.kota} ${formData.kode_pos}`,
        customer_name: formData.nama_lengkap,
        customer_email: formData.email,
        customer_phone: formData.no_telepon,
        catatan: formData.catatan || null
      };

      // Validasi data sebelum insert
      if (!orderData.user_id) {
        throw new Error('User ID is required');
      }
      if (!orderData.total_harga || orderData.total_harga <= 0) {
        throw new Error('Total harga must be greater than 0');
      }
      if (!orderData.alamat_pengiriman) {
        throw new Error('Alamat pengiriman is required');
      }

      console.log('📝 Creating order with data:', orderData);
      console.log('📝 Order data validation passed');

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

      // Insert order items dengan nama_produk
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Cart items is empty');
      }

      const orderItemsData = cartItems.map((item, index) => {
        if (!item.id) {
          throw new Error(`Cart item at index ${index} has no product ID`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Cart item at index ${index} has invalid quantity`);
        }
        if (!item.harga || item.harga <= 0) {
          throw new Error(`Cart item at index ${index} has invalid price`);
        }

        return {
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          harga_satuan: item.harga,
          nama_produk: item.nama_produk || item.nama || 'Produk'
        };
      });

      console.log('📦 Inserting order items:', orderItemsData);
      console.log('📦 Order items count:', orderItemsData.length);
      console.log('📦 Order ID:', order.id);
      console.log('📦 Order items validation passed');

      const { data: insertedItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData)
        .select();

      if (itemsError) {
        console.error('❌ Order items error:', itemsError);
        console.error('❌ Error details:', JSON.stringify(itemsError, null, 2));
        throw new Error(`Failed to insert order items: ${itemsError.message}`);
      }

      if (!insertedItems || insertedItems.length === 0) {
        console.error('❌ No order items returned after insert');
        throw new Error('Failed to insert order items - no data returned');
      }

      console.log('✅ Order items created successfully:', insertedItems.length, 'items');
      console.log('✅ Inserted order items:', insertedItems);

      // ✅ KURANGI STOK PRODUK SAAT ORDER DIBUAT (BUKAN SETELAH PEMBAYARAN)
      console.log('📦 Reducing product stock...');
      for (const item of cartItems) {
        try {
          // Get current stock
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('stok, nama_produk')
            .eq('id', item.id)
            .single();

          if (productError) {
            console.error(`❌ Error fetching product ${item.id}:`, productError);
            continue;
          }

          if (!productData) {
            console.warn(`⚠️ Product ${item.id} not found`);
            continue;
          }

          // Validasi stok cukup
          if (productData.stok < item.quantity) {
            throw new Error(`Stok ${productData.nama_produk} tidak mencukupi. Tersedia: ${productData.stok}, Dibutuhkan: ${item.quantity}`);
          }

          // Update stock - kurangi stok (pastikan operator minus digunakan)
          const currentStock = parseInt(productData.stok) || 0;
          const quantityToReduce = parseInt(item.quantity) || 0;
          const newStock = currentStock - quantityToReduce;
          
          // Validasi: stok baru tidak boleh negatif
          if (newStock < 0) {
            throw new Error(`Stok ${productData.nama_produk} tidak mencukupi. Tersedia: ${currentStock}, Dibutuhkan: ${quantityToReduce}`);
          }
          
          const { error: stockUpdateError } = await supabase
            .from('products')
            .update({ stok: newStock })
            .eq('id', item.id);

          if (stockUpdateError) {
            console.error(`❌ Error updating stock for product ${item.id}:`, stockUpdateError);
            throw new Error(`Gagal mengurangi stok ${productData.nama_produk}`);
          }

          console.log(`✅ Stock updated for product ${productData.nama_produk}: ${productData.stok} → ${newStock}`);
        } catch (stockError) {
          console.error('❌ Error in stock reduction:', stockError);
          throw stockError; // Throw error untuk rollback order
        }
      }
      console.log('✅ All product stocks reduced successfully');

      // ✅ VERIFIKASI: Cek apakah data benar-benar ter-insert
      console.log('🔍 Verifying order and order items in database...');
      const { data: verifyOrder, error: verifyOrderError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', order.id)
        .single();

      if (verifyOrderError) {
        console.error('⚠️ Warning: Could not verify order:', verifyOrderError);
        console.error('⚠️ This might indicate a problem with RLS policies or database access');
      } else {
        console.log('✅ Verification successful - Order found:', verifyOrder.id);
        console.log('✅ Order items count in database:', verifyOrder.order_items?.length || 0);
        
        if (verifyOrder.order_items?.length !== orderItemsData.length) {
          console.warn('⚠️ Warning: Order items count mismatch!');
          console.warn('Expected:', orderItemsData.length, 'Found:', verifyOrder.order_items?.length);
        } else {
          console.log('✅ All order items verified successfully');
        }
      }

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

      // Add payment fee if exists
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
      setOrderId(order.id);
      setTripayReference(tripayPayment.data.reference);

      if (tripayPayment.data.checkout_url && tripayPayment.data.checkout_url !== '#') {
        console.log('🚀 Redirecting to payment page:', tripayPayment.data.checkout_url);
        // ✅ Clear cart sebelum redirect ke Tripay
        if (!hasClearedCartRef.current) {
          hasClearedCartRef.current = true;
          clearCart();
        }
        window.location.href = tripayPayment.data.checkout_url;
      } else {
        // Mock payment - langsung success
        console.log('✅ Mock payment - showing success page');
        setPaymentStatus('success');
        setCurrentStep(4);
        // ✅ Update order status di database untuk mock payment
        await supabase
          .from('orders')
          .update({ status_pembayaran: 'paid' })
          .eq('id', order.id);
        
        // ✅ Stok sudah dikurangi saat order dibuat, tidak perlu dikurangi lagi
        toast.success(t('Pembayaran berhasil!', 'Payment successful!'));
      }

    } catch (error) {
      console.error('❌ ERROR in handlePlaceOrder:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      toast.error(error.message || t('Terjadi kesalahan saat membuat pesanan', 'An error occurred while creating the order'));
      
      // Reset flag jika error
      hasClearedCartRef.current = false;
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

    // Validasi Step 1
    if (currentStep === 1) {
      if (!formData.nama_lengkap || !formData.alamat_pengiriman || !formData.no_telepon) {
        toast.error(t('Harap lengkapi informasi pembeli', 'Please complete buyer information'));
        return;
      }
    }

    // Validasi Step 2
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

    // Validasi Step 3
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
    // ✅ Gunakan tempCartItems jika ada, jika tidak gunakan cartItems
    const itemsToCalculate = tempCartItems.length > 0 ? tempCartItems : cartItems;
    return itemsToCalculate.reduce((total, item) => total + (item.harga * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = formData.biaya_pengiriman > 0 ? formData.biaya_pengiriman : 0;
    const fee = paymentFee > 0 ? paymentFee : 0;
    return subtotal + shipping + fee;
  };

  // ✅ NEW: Fungsi untuk mendapatkan items untuk ditampilkan
  const getDisplayItems = () => {
    if (currentStep === 4 && orderSummary?.items) {
      return orderSummary.items;
    }
    return cartItems;
  };

  // Empty cart check (kecuali step 4)
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
           <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
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
                    <div className={`hidden sm:block w-12 h-0.5 mx-2 ${
                      currentStep > step ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
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
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('Metode Pengiriman','Shipping Method')}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('Pilih metode pengiriman yang sesuai dengan kebutuhan Anda', 'Choose the shipping method that suits your needs')}
                </p>
                
                <div className="space-y-3">
                  {[
                    { value: 'jne', label: 'JNE Reguler', cost: 15000, estimate: '2-3 hari', icon: '📦' },
                    { value: 'jne_oke', label: 'JNE OKE', cost: 12000, estimate: '3-5 hari', icon: '📮' },
                    { value: 'tiki', label: 'TIKI Reguler', cost: 18000, estimate: '1-2 hari', icon: '🚚' },
                    { value: 'pos', label: 'POS Indonesia', cost: 10000, estimate: '4-7 hari', icon: '📪' }
                  ].map((option) => (
                    <div 
                      key={option.value}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.metode_pengiriman === option.value 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md' 
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-600'
                      }`}
                      onClick={() => {
                        handleInputChange('metode_pengiriman', option.value);
                        handleInputChange('biaya_pengiriman', option.cost);
                        toast.success(t(`${option.label} dipilih - ${formatCurrency(option.cost)}`, `${option.label} selected - ${formatCurrency(option.cost)}`));
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={formData.metode_pengiriman === option.value}
                          onChange={() => {}}
                          className="mr-2 w-4 h-4"
                        />
                        <span className="text-2xl">{option.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-200">{option.label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('Estimasi','Estimate')}: <span className="font-medium">{option.estimate}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-600 dark:text-green-400">{formatCurrency(option.cost)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Info pengiriman */}
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</span>
                    <div>
                      <p className="text-blue-900 dark:text-blue-200 font-semibold text-sm mb-1">
                        {t('Pengiriman Tanaman','Plant Delivery')}
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 text-xs">
                        {t('Kami mengemas tanaman dengan aman untuk memastikan kondisi terbaik saat tiba di tangan Anda', 'We pack plants safely to ensure the best condition when they arrive')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Metode Pembayaran */}
            {currentStep === 3 && (
              <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg shadow p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('Metode Pembayaran','Payment Method')}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('Pilih metode pembayaran yang Anda inginkan', 'Choose your preferred payment method')}
                </p>
                
                {paymentChannels.length > 0 ? (
                  <PaymentMethodAccordion 
                    channels={paymentChannels}
                    selectedMethod={selectedPaymentMethod}
                    onSelectMethod={setSelectedPaymentMethod}
                    onFeeChange={setPaymentFee}
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
                {orderId ? (
                  <p className="text-gray-600 dark:text-gray-300 mb-2">{t('Order ID','Order ID')}: <strong>#{orderId}</strong></p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm italic">{t('Memuat Order ID...','Loading Order ID...')}</p>
                )}
                {tripayReference && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{t('Reference','Reference')}: <strong>{tripayReference}</strong></p>
                )}
                
                {/* Order Summary on Success */}
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
                        {formatCurrency(orderSummary?.shipping || formData.biaya_pengiriman)}
                      </span>
                    </div>
                    {(orderSummary?.paymentFee || paymentFee) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{t('Biaya Admin','Admin Fee')}</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {formatCurrency(orderSummary?.paymentFee || paymentFee)}
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
                
                {/* Items purchased list with images */}
                {orderSummary?.items && orderSummary.items.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('Produk yang dibeli','Products Purchased')}:</h4>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {orderSummary.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          {/* Product Image */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                            {item.gambar_url || item.image_url ? (
                              <img
                                src={item.gambar_url || item.image_url}
                                alt={item.nama_produk}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xl">🌱</div>';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">
                                🌱
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-600 dark:text-gray-300 truncate block">
                              {item.nama_produk} × {item.quantity}
                            </span>
                          </div>
                          
                          <span className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {formatCurrency(item.harga * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-4 justify-center mt-6 flex-wrap">
                  <button
                    onClick={() => {
                      // Clear session storage
                      sessionStorage.removeItem('lastOrderSummary');
                      navigate('/orders');
                    }}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors"
                  >
                    📦 {t('Lihat Pesanan','View Orders')}
                  </button>
                  <button
                    onClick={() => {
                      // Clear session storage
                      sessionStorage.removeItem('lastOrderSummary');
                      navigate('/products');
                    }}
                    className="border border-green-600 text-green-600 dark:text-green-400 dark:border-green-500 px-6 py-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10 font-semibold transition-colors"
                  >
                    🛍️ {t('Lanjut Belanja','Continue Shopping')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary - only show in steps 1-3 */}
          {currentStep < 4 && (
            <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg shadow p-6 h-fit transition-colors duration-300">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('Ringkasan Pesanan','Order Summary')}</h2>
              
              {/* Cart Items List with Images */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {getDisplayItems().map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      {item.gambar_url || item.image_url ? (
                        <img
                          src={item.gambar_url || item.image_url}
                          alt={item.nama_produk}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-2xl">🌱</div>';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🌱
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{item.nama_produk}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(item.harga)} × {item.quantity}</p>
                    </div>
                    
                    {/* Product Total */}
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {formatCurrency(item.harga * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Subtotal, Shipping, Total */}
              <div className="border-t pt-4 space-y-2 border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>{t('Subtotal','Subtotal')}</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                
                {/* Shipping Info based on step */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{t('Biaya Pengiriman','Shipping')}</span>
                  {currentStep === 1 ? (
                    <span className="text-xs text-amber-600 dark:text-amber-400 italic font-medium">
                      {t('Pilih di step berikutnya','Select in next step')} →
                    </span>
                  ) : currentStep >= 2 && formData.biaya_pengiriman > 0 ? (
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {formatCurrency(formData.biaya_pengiriman)}
                    </span>
                  ) : (
                    <span className="text-xs text-red-500 dark:text-red-400 italic">
                      {t('Belum dipilih','Not selected')}
                    </span>
                  )}
                </div>
                
                {/* Payment Fee Info - Similar to shipping */}
                {currentStep === 3 ? (
                  paymentFee > 0 ? (
                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                      <span>{t('Biaya Admin','Admin Fee')}</span>
                      <span className="font-medium">{formatCurrency(paymentFee)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{t('Biaya Admin','Admin Fee')}</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 italic font-medium">
                        {t('Pilih metode pembayaran','Select payment method')} →
                      </span>
                    </div>
                  )
                ) : currentStep > 3 && paymentFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>{t('Biaya Admin','Admin Fee')}</span>
                    <span className="font-medium">{formatCurrency(paymentFee)}</span>
                  </div>
                )}
                
                {/* Selected shipping method display */}
                {currentStep >= 2 && formData.metode_pengiriman && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded p-2 text-xs">
                    <p className="text-green-800 dark:text-green-300 font-medium">
                      ✓ {formData.metode_pengiriman.toUpperCase().replace('_', ' ')}
                    </p>
                  </div>
                )}
                
                {/* Selected payment method display */}
                {currentStep >= 3 && selectedPaymentMethod && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded p-2 text-xs">
                    <p className="text-green-800 dark:text-green-300 font-medium">
                      ✓ {selectedPaymentMethod.toUpperCase().replace('_', ' ')}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-gray-100">{t('Total','Total')}</span>
                  <span className="text-green-600 dark:text-green-400 text-lg">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    ← {t('Kembali','Back')}
                  </button>
                )}
                <button
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      {t('Memproses...','Processing...')}
                    </span>
                  ) : currentStep === 3 ? (
                    t('Buat Pesanan','Place Order') + ' 🛒'
                  ) : (
                    t('Lanjutkan','Continue') + ' →'
                  )}
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

  // Calculate fee for a channel
  const calculateChannelFee = (channel) => {
    const flatFee = channel.total_fee?.flat || 0;
    const percentFee = channel.total_fee?.percent || 0;
    return { flat: flatFee, percent: percentFee };
  };

  // Handle payment method selection with fee
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
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedMethod === channel.code
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-600'
                    }`}
                    onClick={() => handleSelectMethod(channel)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
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
                          <span className="text-2xl">💳</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-200">{channel.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {channel.group}
                        </p>
                      </div>
                    </div>
                    
                    {/* Fee Display - Similar to Step 2 */}
                    <div className="text-right ml-3 flex-shrink-0">
                      {fee.flat > 0 ? (
                        <p className="font-bold text-lg text-green-600 dark:text-green-400">{formatCurrency(fee.flat)}</p>
                      ) : fee.percent > 0 ? (
                        <p className="font-bold text-lg text-green-600 dark:text-green-400">{fee.percent}%</p>
                      ) : (
                        <p className="font-bold text-lg text-green-600 dark:text-green-400">Gratis</p>
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