import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { tripayService } from '../services/tripay';
import { v4 as uuidv4 } from 'uuid';

const Checkout = () => {
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
  
  const [orderSummary, setOrderSummary] = useState(null);
  const [tempCartItems, setTempCartItems] = useState([]);
  const hasClearedCartRef = useRef(false);

  const [formData, setFormData] = useState({
    email: '',
    nama_lengkap: '',
    kota: '',
    alamat_pengiriman: '',
    kode_pos: '',
    no_telepon: '',
    metode_pengiriman: '',
    biaya_pengiriman: 0
  });

  const isDevMode = import.meta.env.MODE === 'development';

  // ========== USE EFFECTS ==========

  useEffect(() => {
    if (isDevMode) {
      console.log('🧪 DEVELOPMENT MODE ACTIVE');
    }
  }, []);

  // Cek callback dari Tripay
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const reference = searchParams.get('reference');
        if (reference) {
          console.log('🔄 Callback detected:', reference);
          await checkPaymentStatus(reference);
        }
      } catch (error) {
        console.error('❌ Callback error:', error);
      }
    };
    handleCallback();
  }, [searchParams]);

  // Load payment channels
  useEffect(() => {
    const loadPaymentChannels = async () => {
      try {
        const response = await tripayService.getPaymentChannels();
        if (response.success && response.data) {
          setPaymentChannels(response.data);
        }
      } catch (error) {
        console.error('❌ Error loading payment channels:', error);
      }
    };
    loadPaymentChannels();
  }, []);

  // Auto-fill form
  useEffect(() => {
    if (user) {
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

  // ========== FUNGSI UTAMA ==========

  const saveOrderSummary = () => {
    const summary = {
      subtotal: calculateSubtotal(),
      shipping: formData.biaya_pengiriman,
      paymentFee: paymentFee,
      total: calculateTotal(),
      items: [...cartItems],
      timestamp: new Date().toISOString()
    };
    
    setOrderSummary(summary);
    sessionStorage.setItem('lastOrderSummary', JSON.stringify(summary));
    setTempCartItems([...cartItems]);
  };

  const formatOrderItems = () => {
    return cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      harga_satuan: item.harga,
      subtotal: item.harga * item.quantity,
      nama_produk: item.nama_produk?.substring(0, 100) || 'Produk'
    }));
  };

  const updateProductStockAfterPayment = async (orderId) => {
    if (isDevMode) {
      console.log('🧪 Simulating stock update for order:', orderId);
      return;
    }
    
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
            .update({ stok: Math.max(0, product.stok - item.quantity) })
            .eq('id', item.product_id);
        }
      }
    } catch (error) {
      console.error('❌ Error updating stock:', error);
    }
  };

  const handlePlaceOrder = async () => {
    // Validasi awal
    if (cartItems.length === 0) {
      toast.error(t('Keranjang kosong', 'Cart is empty'));
      return;
    }

    if (formData.biaya_pengiriman <= 0) {
      toast.error(t('Pilih metode pengiriman', 'Select shipping method'));
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error(t('Pilih metode pembayaran', 'Select payment method'));
      return;
    }

    let orderId = null;
    let tripayRef = null;
    let merchantRef = null;
    
    try {
      setLoading(true);
      setIsSubmitting(true);
      
      if (!user) {
        toast.error(t('Silakan login terlebih dahulu', 'Please login first'));
        navigate('/login');
        return;
      }

      // Hitung total
      const totalHarga = calculateSubtotal();
      const totalAmount = calculateTotal();

      console.log('💰 Order totals:', { totalHarga, shipping: formData.biaya_pengiriman, fee: paymentFee, totalAmount });

      // Simpan ringkasan
      saveOrderSummary();

      // ========== BUAT ORDER ==========
      merchantRef = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Generate ID untuk development
      if (isDevMode) {
        orderId = uuidv4();
        console.log('🧪 Generated order ID:', orderId);
      }

      const orderData = {
        ...(isDevMode && { id: orderId }),
        user_id: user.id,
        total_harga: totalHarga,
        biaya_pengiriman: formData.biaya_pengiriman,
        biaya_admin: paymentFee,
        status_pembayaran: 'unpaid',
        status_pengiriman: 'pending',
        metode_pembayaran: selectedPaymentMethod,
        alamat_pengiriman: `${formData.alamat_pengiriman}, ${formData.kota} ${formData.kode_pos}`.substring(0, 500),
        customer_name: formData.nama_lengkap.substring(0, 100),
        customer_email: formData.email.substring(0, 100),
        customer_phone: formData.no_telepon.substring(0, 20),
        merchant_ref: merchantRef,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 Order data:', orderData);

      let order;
      if (isDevMode) {
        // DEVELOPMENT: Simulasi
        console.log('🧪 Simulating order creation');
        order = { id: orderId, ...orderData };
        
        // Simpan ke sessionStorage
        const devOrders = JSON.parse(sessionStorage.getItem('dev_orders') || '[]');
        devOrders.push(order);
        sessionStorage.setItem('dev_orders', JSON.stringify(devOrders));
        sessionStorage.setItem('lastOrderId', orderId);
        
      } else {
        // PRODUCTION: Insert ke database
        const { data, error } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (error) {
          console.error('❌ Database error:', error);
          throw new Error(`Gagal menyimpan order: ${error.message}`);
        }
        
        if (!data || !data.id) {
          throw new Error('Order tidak berhasil dibuat');
        }
        
        order = data;
        orderId = order.id;
        sessionStorage.setItem('lastOrderId', orderId);
      }

      console.log('✅ Order created:', orderId);

      // ========== INSERT ORDER ITEMS ==========
      const orderItemsData = formatOrderItems().map(item => ({
        id: uuidv4(), // UUID yang valid
        order_id: orderId,
        ...item,
        created_at: new Date().toISOString()
      }));

      console.log('📦 Order items to save:', orderItemsData.length);

      if (isDevMode) {
        // DEVELOPMENT: Simpan ke sessionStorage
        console.log('🧪 Saving order items to session');
        const devOrderItems = JSON.parse(sessionStorage.getItem('dev_order_items') || '[]');
        devOrderItems.push(...orderItemsData);
        sessionStorage.setItem('dev_order_items', JSON.stringify(devOrderItems));
        
      } else {
        // PRODUCTION: Insert ke database
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData);

        if (itemsError) {
          console.error('❌ Order items error:', itemsError);
          throw new Error(`Gagal menyimpan items: ${itemsError.message}`);
        }
      }

      console.log('✅ Order items saved');

      // ========== BUAT PEMBAYARAN ==========
      const tripayOrderItems = [
        ...cartItems.map(item => ({
          name: item.nama_produk?.substring(0, 50) || 'Produk',
          price: item.harga,
          quantity: item.quantity
        }))
      ];

      if (formData.biaya_pengiriman > 0) {
        tripayOrderItems.push({
          name: `Biaya Pengiriman (${formData.metode_pengiriman})`,
          price: formData.biaya_pengiriman,
          quantity: 1
        });
      }

      if (paymentFee > 0) {
        tripayOrderItems.push({
          name: 'Biaya Admin',
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
        return_url: `${window.location.origin}/checkout?reference=${merchantRef}`,
        expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      };

      console.log('💰 Creating payment...');

      let tripayPayment;
      if (isDevMode) {
        // DEVELOPMENT: Mock payment
        console.log('🧪 Mocking Tripay payment');
        tripayPayment = {
          success: true,
          data: {
            reference: `DEV-REF-${Date.now()}`,
            checkout_url: '#',
            merchant_ref: merchantRef
          }
        };
      } else {
        // PRODUCTION: Real payment
        tripayPayment = await tripayService.createTransaction(transactionData);
      }

      if (!tripayPayment?.success) {
        throw new Error(tripayPayment?.message || 'Gagal membuat pembayaran');
      }

      tripayRef = tripayPayment.data.reference;
      console.log('✅ Payment created:', tripayRef);

      // Update order dengan reference
      if (isDevMode) {
        // Update di sessionStorage
        const devOrders = JSON.parse(sessionStorage.getItem('dev_orders') || '[]');
        const updatedOrders = devOrders.map(o => 
          o.id === orderId 
            ? { ...o, tripay_reference: tripayRef, tripay_checkout_url: tripayPayment.data.checkout_url }
            : o
        );
        sessionStorage.setItem('dev_orders', JSON.stringify(updatedOrders));
      } else {
        await supabase
          .from('orders')
          .update({
            tripay_reference: tripayRef,
            tripay_checkout_url: tripayPayment.data.checkout_url || '#',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      }

      // ========== SET STATE ==========
      setOrderId(orderId);
      setTripayReference(tripayRef);

      // Clear cart
      if (!hasClearedCartRef.current) {
        hasClearedCartRef.current = true;
        clearCart();
      }

      // Redirect atau success
      if (tripayPayment.data.checkout_url && tripayPayment.data.checkout_url !== '#') {
        console.log('🚀 Redirecting to Tripay...');
        window.location.href = tripayPayment.data.checkout_url;
      } else {
        // Mock success
        console.log('✅ Showing success page');
        
        if (isDevMode) {
          // Update status di sessionStorage
          const devOrders = JSON.parse(sessionStorage.getItem('dev_orders') || '[]');
          const updatedOrders = devOrders.map(o => 
            o.id === orderId 
              ? { ...o, status_pembayaran: 'paid', updated_at: new Date().toISOString() }
              : o
          );
          sessionStorage.setItem('dev_orders', JSON.stringify(updatedOrders));
        } else {
          await supabase
            .from('orders')
            .update({
              status_pembayaran: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId);
        }
        
        await updateProductStockAfterPayment(orderId);
        
        setPaymentStatus('success');
        setCurrentStep(4);
        toast.success(t('Pembayaran berhasil!', 'Payment successful!'));
      }

    } catch (error) {
      console.error('❌ Order error:', error);
      hasClearedCartRef.current = false;
      
      let errorMessage = error.message;
      if (error.message.includes('Database')) {
        errorMessage = t('Gagal menyimpan pesanan ke database', 'Failed to save order');
      } else if (error.message.includes('items')) {
        errorMessage = t('Gagal menyimpan item pesanan', 'Failed to save order items');
      }
      
      toast.error(errorMessage);
      
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const checkPaymentStatus = async (reference) => {
    try {
      console.log('🔍 Checking payment status:', reference);
      
      if (isDevMode) {
        // DEVELOPMENT: Check sessionStorage
        const devOrders = JSON.parse(sessionStorage.getItem('dev_orders') || '[]');
        const order = devOrders.find(o => o.merchant_ref === reference || o.tripay_reference === reference);
        
        if (order && order.status_pembayaran === 'paid') {
          setPaymentStatus('success');
          setOrderId(order.id);
          setTripayReference(order.tripay_reference || reference);
          setCurrentStep(4);
          
          if (!hasClearedCartRef.current) {
            hasClearedCartRef.current = true;
            clearCart();
          }
          
          toast.success(t('Pembayaran berhasil!', 'Payment successful!'));
        }
      } else {
        // PRODUCTION: Check database
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .or(`tripay_reference.eq.${reference},merchant_ref.ilike.%${reference}%`)
          .limit(1);

        if (orders && orders.length > 0) {
          const order = orders[0];
          if (order.status_pembayaran === 'paid') {
            setPaymentStatus('success');
            setOrderId(order.id);
            setTripayReference(order.tripay_reference || reference);
            setCurrentStep(4);
            
            await updateProductStockAfterPayment(order.id);
            saveOrderSummary();
            
            if (!hasClearedCartRef.current) {
              hasClearedCartRef.current = true;
              clearCart();
            }
            
            toast.success(t('Pembayaran berhasil!', 'Payment successful!'));
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking status:', error);
    }
  };

  // ========== HELPER FUNCTIONS ==========

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.nama_lengkap || !formData.alamat_pengiriman || !formData.no_telepon) {
        toast.error(t('Lengkapi informasi', 'Complete information'));
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.metode_pengiriman) {
        toast.error(t('Pilih pengiriman', 'Select shipping'));
        return;
      }
    }

    if (currentStep === 3 && !selectedPaymentMethod) {
      toast.error(t('Pilih pembayaran', 'Select payment'));
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
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateSubtotal = () => {
    const items = tempCartItems.length > 0 ? tempCartItems : cartItems;
    return items.reduce((total, item) => total + (item.harga * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + formData.biaya_pengiriman + paymentFee;
  };

  const getDisplayItems = () => {
    return currentStep === 4 && orderSummary?.items ? orderSummary.items : cartItems;
  };

  // ========== RENDER ==========

  if (!cartItems?.length && currentStep !== 4) {
    return (
      <div className="min-h-screen mt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-4">{t('Keranjang Kosong', 'Cart is empty')}</h2>
          <button
            onClick={() => navigate('/products')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            {t('Belanja Sekarang', 'Shop Now')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-16 bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {currentStep === 4 ? t('Pembayaran Selesai', 'Payment Complete') : t('Checkout', 'Checkout')}
          </h1>
          <p className="text-gray-600">
            {currentStep === 4 
              ? t('Terima kasih telah berbelanja', 'Thank you for shopping')
              : t('Lengkapi informasi berikut', 'Complete information')
            }
          </p>
        </div>

        {/* Progress */}
        {currentStep < 4 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex justify-center gap-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= step ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  <span className={`ml-2 ${currentStep >= step ? 'text-green-600' : 'text-gray-500'}`}>
                    {step === 1 ? t('Info', 'Info') : step === 2 ? t('Kirim', 'Ship') : t('Bayar', 'Pay')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className={currentStep === 4 ? 'lg:col-span-3' : 'lg:col-span-2'}>
            
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">{t('Informasi', 'Information')}</h2>
                <div className="space-y-4">
                  {['nama_lengkap', 'email', 'no_telepon', 'kota', 'alamat_pengiriman', 'kode_pos'].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium mb-2">
                        {t(field === 'nama_lengkap' ? 'Nama' :
                           field === 'email' ? 'Email' :
                           field === 'no_telepon' ? 'Telepon' :
                           field === 'kota' ? 'Kota' :
                           field === 'alamat_pengiriman' ? 'Alamat' : 'Kode Pos')}
                      </label>
                      {field === 'alamat_pengiriman' ? (
                        <textarea
                          value={formData[field]}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows="3"
                          required
                        />
                      ) : (
                        <input
                          type={field === 'email' ? 'email' : field === 'no_telepon' ? 'tel' : 'text'}
                          value={formData[field]}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                          required={field !== 'kode_pos'}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">{t('Pengiriman', 'Shipping')}</h2>
                <div className="space-y-3">
                  {[
                    { value: 'jne', label: 'JNE Reguler', cost: 15000, days: '2-3' },
                    { value: 'jne_oke', label: 'JNE OKE', cost: 12000, days: '3-5' },
                    { value: 'tiki', label: 'TIKI Reguler', cost: 18000, days: '1-2' },
                    { value: 'pos', label: 'POS Indonesia', cost: 10000, days: '4-7' }
                  ].map((option) => (
                    <div
                      key={option.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer ${
                        formData.metode_pengiriman === option.value ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                      onClick={() => {
                        handleInputChange('metode_pengiriman', option.value);
                        handleInputChange('biaya_pengiriman', option.cost);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{option.label}</p>
                          <p className="text-sm text-gray-500">
                            {option.days} {t('hari', 'days')}
                          </p>
                        </div>
                        <p className="font-bold text-green-600">{formatCurrency(option.cost)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">{t('Pembayaran', 'Payment')}</h2>
                {paymentChannels.length > 0 ? (
                  <PaymentMethodAccordion 
                    channels={paymentChannels}
                    selectedMethod={selectedPaymentMethod}
                    onSelectMethod={setSelectedPaymentMethod}
                    onFeeChange={setPaymentFee}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p>{t('Memuat...', 'Loading...')}</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && paymentStatus === 'success' && (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-green-600 mb-4">{t('Berhasil!', 'Success!')}</h2>
                
                {orderId && <p className="mb-2">{t('Order ID', 'Order ID')}: <strong>#{orderId}</strong></p>}
                {tripayReference && <p className="mb-6">{t('Referensi', 'Reference')}: {tripayReference}</p>}
                
                <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>{t('Total', 'Total')}</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(orderSummary?.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => navigate('/orders')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                  >
                    {t('Lihat Pesanan', 'View Orders')}
                  </button>
                  <button
                    onClick={() => navigate('/products')}
                    className="border border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50"
                  >
                    {t('Belanja Lagi', 'Shop Again')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          {currentStep < 4 && (
            <div className="bg-white rounded-lg shadow p-6 h-fit">
              <h2 className="text-xl font-semibold mb-4">{t('Ringkasan', 'Summary')}</h2>
              
              <div className="space-y-3 mb-4">
                {getDisplayItems().map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.nama_produk}</p>
                      <p className="text-sm text-gray-500">{item.quantity} × {formatCurrency(item.harga)}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.harga * item.quantity)}</p>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>{t('Subtotal', 'Subtotal')}</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('Pengiriman', 'Shipping')}</span>
                  <span>
                    {formData.biaya_pengiriman > 0 
                      ? formatCurrency(formData.biaya_pengiriman)
                      : '-'
                    }
                  </span>
                </div>
                {paymentFee > 0 && (
                  <div className="flex justify-between">
                    <span>{t('Biaya', 'Fee')}</span>
                    <span className="text-amber-600">+{formatCurrency(paymentFee)}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('Total', 'Total')}</span>
                    <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200"
                  >
                    ← {t('Kembali', 'Back')}
                  </button>
                )}
                <button
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {t('Memproses', 'Processing')}
                    </span>
                  ) : currentStep === 3 ? (
                    `${t('Buat Pesanan', 'Place Order')} 🛒`
                  ) : (
                    `${t('Lanjut', 'Continue')} →`
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

// Payment Method Accordion (Simplified)
const PaymentMethodAccordion = ({ channels, selectedMethod, onSelectMethod, onFeeChange }) => {
  const handleSelect = (channel) => {
    onSelectMethod(channel.code);
    onFeeChange(channel.total_fee?.flat || 0);
  };

  return (
    <div className="space-y-3">
      {channels.map((channel) => (
        <div
          key={channel.code}
          className={`p-4 border-2 rounded-lg cursor-pointer ${
            selectedMethod === channel.code ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}
          onClick={() => handleSelect(channel)}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-white border rounded">
                {channel.icon_url ? (
                  <img src={channel.icon_url} alt={channel.name} className="max-w-full max-h-full" />
                ) : (
                  <span>💳</span>
                )}
              </div>
              <div>
                <p className="font-medium">{channel.name}</p>
                <p className="text-sm text-gray-500">{channel.group}</p>
              </div>
            </div>
            <div>
              {(channel.total_fee?.flat || 0) > 0 ? (
                <div className="bg-amber-100 px-2 py-1 rounded">
                  <p className="text-xs font-semibold text-amber-700">
                    +{formatCurrency(channel.total_fee.flat)}
                  </p>
                </div>
              ) : (
                <div className="bg-green-100 px-2 py-1 rounded">
                  <p className="text-xs font-semibold text-green-700">Free</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Checkout;