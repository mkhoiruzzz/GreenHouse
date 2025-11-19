// Checkout.jsx - FINAL VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { tripayService } from '../services/tripay';

const Checkout = () => {
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
    is_dropshipper: false,
    metode_pengiriman: '',
    biaya_pengiriman: 15000,
    metode_pembayaran: 'tripay',
    kode_kupon: ''
  });

  // ✅ Cek parameter callback dari Tripay
  useEffect(() => {
    const reference = searchParams.get('reference');
    const status = searchParams.get('status');
    
    if (reference) {
      console.log('🔄 Tripay callback detected:', { reference, status });
      setTripayReference(reference);
      checkPaymentStatus(reference);
      
      if (status === 'success') {
        setPaymentStatus('success');
        setCurrentStep(4);
      }
    }
  }, [searchParams]);

  // ✅ Fungsi cek status pembayaran
  const checkPaymentStatus = async (reference) => {
    try {
      console.log('🔍 Checking payment status for:', reference);
      
      // Cek di database
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('tripay_reference', reference)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        return;
      }

      if (order) {
        console.log('📦 Order found:', order);
        
        if (order.status_pembayaran === 'paid') {
          setPaymentStatus('success');
          setOrderId(order.id);
          setCurrentStep(4);
          await updateProductStockAfterPayment(order.id);
          toast.success('Pembayaran berhasil! Pesanan Anda sedang diproses.');
        } else {
          // Cek langsung ke Tripay
          try {
            const tripayStatus = await tripayService.checkTransaction(reference);
            if (tripayStatus.data.status === 'PAID') {
              // Update database
              await supabase
                .from('orders')
                .update({ 
                  status_pembayaran: 'paid',
                  updated_at: new Date().toISOString()
                })
                .eq('tripay_reference', reference);

              setPaymentStatus('success');
              setOrderId(order.id);
              setCurrentStep(4);
              await updateProductStockAfterPayment(order.id);
              toast.success('Pembayaran berhasil! Pesanan Anda sedang diproses.');
            }
          } catch (tripayError) {
            console.error('Error checking Tripay status:', tripayError);
          }
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  // ✅ Load payment channels
  useEffect(() => {
    const loadPaymentChannels = async () => {
      try {
        console.log('🔄 Loading Tripay payment channels...');
        const response = await tripayService.getPaymentChannels();
        if (response.success) {
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

  // ✅ Auto-fill form dari user profile
  useEffect(() => {
    if (user) {
      console.log('🔄 Auto-filling form from user profile:', user);
      
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        nama_lengkap: user.user_metadata?.full_name || user.user_metadata?.nama_lengkap || '',
        kota: user.user_metadata?.city || user.user_metadata?.kota || '',
        alamat_pengiriman: user.user_metadata?.address || user.user_metadata?.alamat_pengiriman || '',
        kode_pos: user.user_metadata?.postal_code || user.user_metadata?.kode_pos || '',
        no_telepon: user.user_metadata?.phone || user.user_metadata?.no_telepon || ''
      }));
    }
  }, [user]);

  // ✅ Format order items
  const formatOrderItems = () => {
    const formattedItems = cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      harga_satuan: item.harga
    }));
    
    console.log('📦 Formatted order items:', formattedItems);
    return formattedItems;
  };

  const steps = [
    { number: 1, title: 'Informasi Pembeli' },
    { number: 2, title: 'Metode Pengiriman' },
    { number: 3, title: 'Metode Pembayaran' },
    { number: 4, title: 'Selesai' }
  ];

  // ✅ Fungsi membuat pembayaran Tripay
  const createTripayPayment = async (orderData, orderItems) => {
    try {
      console.log('💰 Creating Tripay payment...');
      
      const totalAmount = calculateTotal();
      
      // Format items untuk Tripay
      const tripayItems = cartItems.map(item => ({
        name: item.nama_produk.substring(0, 50), // Max 50 chars
        price: item.harga,
        quantity: item.quantity
      }));

      const merchantRef = `ORDER-${orderData.id}-${Date.now()}`;
      
      const transactionData = {
        method: selectedPaymentMethod,
        merchant_ref: merchantRef,
        amount: totalAmount,
        customer_name: formData.nama_lengkap,
        customer_email: formData.email,
        customer_phone: formData.no_telepon,
        order_items: tripayItems,
        return_url: `${window.location.origin}/checkout?reference=${merchantRef}&status=success`,
        expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      };

      console.log('📦 Tripay transaction data:', transactionData);

      const tripayResponse = await tripayService.createTransaction(transactionData);
      
      if (tripayResponse.success) {
        console.log('✅ Tripay payment created:', tripayResponse.data);
        return tripayResponse.data;
      } else {
        throw new Error(tripayResponse.message || 'Gagal membuat pembayaran Tripay');
      }
    } catch (error) {
      console.error('❌ Error creating Tripay payment:', error);
      throw error;
    }
  };

  // ✅ Update stok produk setelah pembayaran
  const updateProductStockAfterPayment = async (orderId) => {
    try {
      console.log('🔄 Updating stock after successful payment for order:', orderId);
      
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (error) {
        console.error('Error fetching order items:', error);
        return false;
      }

      console.log('📦 Order items to update stock:', orderItems);

      for (const item of orderItems) {
        const { data: currentProduct, error: fetchError } = await supabase
          .from('products')
          .select('stok, nama_produk')
          .eq('id', item.product_id)
          .single();

        if (fetchError) {
          console.error(`❌ Error fetching product ${item.product_id}:`, fetchError);
          continue;
        }

        const newStock = (currentProduct.stok || 0) - item.quantity;
        
        if (newStock < 0) {
          console.warn(`⚠️ Insufficient stock for product ${item.product_id}`);
          continue;
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            stok: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_id);

        if (updateError) {
          console.error(`❌ Error updating stock for product ${item.product_id}:`, updateError);
        } else {
          console.log(`✅ Stock updated for product ${item.product_id}: ${currentProduct.stok} → ${newStock}`);
        }
      }
      
      console.log('✅ Stock update after payment completed');
      return true;
      
    } catch (error) {
      console.error('❌ Error in updateProductStockAfterPayment:', error);
      return false;
    }
  };

  // Di Checkout.jsx - tambah di bagian handlePlaceOrder
// Di Checkout.jsx - update bagian handlePlaceOrder
const handlePlaceOrder = async () => {
  try {
    setLoading(true);
    setIsSubmitting(true);
    console.log('🔄 Starting order placement...');

    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      navigate('/login');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Pilih metode pembayaran terlebih dahulu');
      return;
    }

    // Format data order
    const orderItems = formatOrderItems();
    const totalHarga = calculateSubtotal();
    const biayaPengiriman = formData.biaya_pengiriman || 15000;
    const totalAmount = calculateTotal();

    // Data order untuk database
    const orderData = {
      user_id: user.id,
      total_harga: totalHarga,
      biaya_pengiriman: biayaPengiriman,
      status_pembayaran: 'unpaid',
      status_pengiriman: 'pending',
      metode_pembayaran: `tripay_${selectedPaymentMethod}`,
      alamat_pengiriman: `${formData.alamat_pengiriman}, ${formData.kota} ${formData.kode_pos}`,
      customer_name: formData.nama_lengkap,
      customer_email: formData.email,
      customer_phone: formData.no_telepon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Creating order in database...');

    // Insert order ke Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('❌ Database error:', orderError);
      throw new Error(`Gagal membuat order: ${orderError.message}`);
    }

    console.log('✅ Order created in database:', order.id);

    // Insert order items
    const orderItemsData = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      console.error('❌ Order items error:', itemsError);
      throw new Error(`Gagal menambahkan items: ${itemsError.message}`);
    }

    console.log('✅ Order items created');

    // ✅ CREATE PAYMENT (Mock/Real)
    console.log('💰 Creating payment...');
    
    const tripayItems = cartItems.map(item => ({
      name: item.nama_produk.substring(0, 50),
      price: item.harga,
      quantity: item.quantity
    }));

    const merchantRef = `ORDER-${order.id}-${Date.now()}`;
    
    const transactionData = {
      method: selectedPaymentMethod,
      merchant_ref: merchantRef,
      amount: totalAmount,
      customer_name: formData.nama_lengkap,
      customer_email: formData.email,
      customer_phone: formData.no_telepon,
      order_items: tripayItems,
      return_url: `${window.location.origin}/checkout?reference=${merchantRef}&status=success`,
      expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    };

    const tripayPayment = await tripayService.createTransaction(transactionData);
    
    if (!tripayPayment.success) {
      throw new Error(tripayPayment.message || 'Gagal membuat pembayaran');
    }

    console.log('✅ Payment created:', tripayPayment.data);

    // Update order dengan payment reference
    await supabase
      .from('orders')
      .update({
        tripay_reference: tripayPayment.data.reference,
        tripay_checkout_url: tripayPayment.data.checkout_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    console.log('🎉 Order placement successful!');
    
    // ✅ HANDLE REDIRECT/SIMULATION
    if (tripayPayment.data.checkout_url && tripayPayment.data.checkout_url !== '#') {
      // Real Tripay - redirect ke payment page
      console.log('🚀 Redirecting to payment page...');
      window.location.href = tripayPayment.data.checkout_url;
    } else {
      // Mock payment - langsung ke success
      console.log('🎭 Mock payment - langsung ke success');
      setOrderId(order.id);
      setTripayReference(tripayPayment.data.reference);
      setPaymentStatus('success');
      setCurrentStep(4);
      clearCart();
      toast.success('Pembayaran berhasil! Pesanan Anda sedang diproses.');
    }

  } catch (error) {
    console.error('❌ Error placing order:', error);
    toast.error(error.message || 'Terjadi kesalahan saat membuat pesanan');
  } finally {
    setLoading(false);
    setIsSubmitting(false);
  }
};

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNextStep = () => {
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
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.harga * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + (formData.biaya_pengiriman || 0);
  };

  // ✅ STEP 4: Payment Success Component
  const PaymentSuccess = () => {
    useEffect(() => {
      // Clear cart ketika pembayaran sukses
      clearCart();
    }, []);

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-600 mb-4">Pembayaran Berhasil!</h2>
          <p className="text-gray-600 mb-2">
            Terima kasih telah berbelanja di toko kami.
          </p>
          <p className="text-gray-600 mb-2">
            Order ID: <strong>#{orderId}</strong>
          </p>
          {tripayReference && (
            <p className="text-gray-600 mb-4">
              Reference: <strong>{tripayReference}</strong>
            </p>
          )}
          <p className="text-gray-600 mb-6">
            Pesanan Anda sedang diproses dan akan segera dikirim.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => navigate('/orders')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Lihat Pesanan
            </button>
            <button
              onClick={() => navigate('/products')}
              className="border border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition"
            >
              Lanjut Belanja
            </button>
          </div>

          {/* Order Summary di Success Page */}
          <div className="mt-8 border-t pt-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Ringkasan Pesanan</h3>
            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{item.nama_produk}</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.harga)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {formatCurrency(item.harga * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Biaya Pengiriman</span>
                <span className="text-gray-900">{formatCurrency(formData.biaya_pengiriman)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Payment Pending Component
  const PaymentPending = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Menunggu Pembayaran</h2>
          <p className="text-gray-600 mb-4">
            Silakan selesaikan pembayaran Anda melalui halaman Tripay.
          </p>
          {tripayReference && (
            <p className="text-gray-600 mb-4">
              Reference: <strong>{tripayReference}</strong>
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Cek Status Pembayaran
          </button>
        </div>
      </div>
    );
  };

  if (cartItems.length === 0 && currentStep !== 4) {
    return (
      <div className="min-h-screen mt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Keranjang Kosong</h2>
          <button
            onClick={() => navigate('/products')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Belanja Sekarang
          </button>
        </div>
      </div>
    );
  }

  // Render steps
  return (
    <div className="min-h-screen mt-16 bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStep === 4 ? 'Pembayaran Selesai' : 'Checkout'}
          </h1>
          <p className="text-gray-600">
            {currentStep === 4 
              ? 'Terima kasih telah berbelanja di toko kami' 
              : 'Selesaikan pembelian Anda dalam 3 langkah mudah'
            }
          </p>
        </div>

        {/* Progress Steps - jangan tampilkan di step 4 */}
        {currentStep < 4 && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
            <div className="hidden md:flex items-center justify-between">
              {steps.slice(0, 3).map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : 'border-gray-300 text-gray-500'
                  } font-semibold`}>
                    {step.number}
                  </div>
                  <span className={`ml-2 font-medium ${
                    currentStep >= step.number ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  {index < 2 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
              <div className="flex justify-between items-center mb-4">
                {steps.slice(0, 3).map((step) => (
                  <div 
                    key={step.number} 
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      currentStep >= step.number 
                        ? 'bg-green-600 border-green-600 text-white' 
                        : 'border-gray-300 text-gray-500'
                    } font-semibold text-sm`}
                  >
                    {step.number}
                  </div>
                ))}
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                ></div>
              </div>
              
              <div className="text-center">
                <span className="text-sm font-medium text-green-600">
                  Langkah {currentStep}: {steps.find(step => step.number === currentStep)?.title}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className={`${currentStep === 4 ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
            {currentStep === 1 && (
              <InformasiPembeli 
                formData={formData} 
                onInputChange={handleInputChange}
                user={user}
              />
            )}
            
            {currentStep === 2 && (
              <MetodePengiriman 
                formData={formData} 
                onInputChange={handleInputChange} 
              />
            )}
            
            {currentStep === 3 && (
              <MetodePembayaran 
                formData={formData} 
                onInputChange={handleInputChange}
                paymentChannels={paymentChannels}
                selectedPaymentMethod={selectedPaymentMethod}
                onPaymentMethodSelect={setSelectedPaymentMethod}
              />
            )}
            
            {currentStep === 4 && paymentStatus === 'success' && (
              <PaymentSuccess />
            )}
            
            {currentStep === 4 && paymentStatus === 'pending' && (
              <PaymentPending />
            )}
          </div>

          {/* Order Summary - hanya tampilkan di step 1-3 */}
          {currentStep < 4 && (
            <OrderSummary 
              cartItems={cartItems}
              subtotal={calculateSubtotal()}
              shippingCost={formData.biaya_pengiriman}
              total={calculateTotal()}
              currentStep={currentStep}
              onPrevStep={handlePrevStep}
              onNextStep={handleNextStep}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Komponen InformasiPembeli
const InformasiPembeli = ({ formData, onInputChange, user }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Informasi Pembeli</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
          <input
            type="text"
            value={formData.nama_lengkap}
            onChange={(e) => onInputChange('nama_lengkap', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon</label>
          <input
            type="tel"
            value={formData.no_telepon}
            onChange={(e) => onInputChange('no_telepon', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kota</label>
          <input
            type="text"
            value={formData.kota}
            onChange={(e) => onInputChange('kota', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Pengiriman</label>
          <textarea
            value={formData.alamat_pengiriman}
            onChange={(e) => onInputChange('alamat_pengiriman', e.target.value)}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kode Pos</label>
          <input
            type="text"
            value={formData.kode_pos}
            onChange={(e) => onInputChange('kode_pos', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.subscribe_newsletter}
            onChange={(e) => onInputChange('subscribe_newsletter', e.target.checked)}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label className="ml-2 text-sm text-gray-700">Berlangganan newsletter</label>
        </div>
      </div>
    </div>
  );
};

// Komponen MetodePengiriman
const MetodePengiriman = ({ formData, onInputChange }) => {
  const shippingOptions = [
    { value: 'jne', label: 'JNE Reguler', cost: 15000, estimate: '2-3 hari' },
    { value: 'jne_oke', label: 'JNE OKE', cost: 12000, estimate: '3-5 hari' },
    { value: 'tiki', label: 'TIKI Reguler', cost: 18000, estimate: '1-2 hari' },
    { value: 'pos', label: 'POS Indonesia', cost: 10000, estimate: '4-7 hari' }
  ];

  const handleShippingChange = (method, cost) => {
    onInputChange('metode_pengiriman', method);
    onInputChange('biaya_pengiriman', cost);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Metode Pengiriman</h2>
      
      <div className="space-y-3">
        {shippingOptions.map((option) => (
          <div 
            key={option.value}
            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${
              formData.metode_pengiriman === option.value 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-green-300'
            }`}
            onClick={() => handleShippingChange(option.value, option.cost)}
          >
            <div className="flex items-center">
              <input
                type="radio"
                name="shippingMethod"
                checked={formData.metode_pengiriman === option.value}
                onChange={() => handleShippingChange(option.value, option.cost)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <div className="ml-3">
                <p className="font-medium text-gray-900">{option.label}</p>
                <p className="text-sm text-gray-500">Estimasi: {option.estimate}</p>
              </div>
            </div>
            <p className="font-semibold text-gray-900">{formatCurrency(option.cost)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Replace MetodePembayaran component di Checkout.jsx
const MetodePembayaran = ({ formData, onInputChange, paymentChannels, selectedPaymentMethod, onPaymentMethodSelect }) => {
  const [openCategories, setOpenCategories] = useState({
    'Virtual Account': true,
    'E-Wallet': true,
    'Convenience Store': true,
    'QR Code': true
  });

  // Di dalam MetodePembayaran component, ganti function getPaymentIcon:
const getPaymentIcon = (channel) => {
  // Prioritas 1: Gunakan icon_url dari API response jika valid
  if (channel.icon_url && channel.icon_url.includes('tripay.co.id')) {
    return channel.icon_url;
  }
  
  // Prioritas 2: Fallback ke mapping lokal JIKA icon_url tidak valid
  const code = channel.code.toUpperCase();
  
  // Mapping ke Tripay CDN (bukan local files)
  const iconMap = {
    // Virtual Accounts
    'BRIVA': 'https://tripay.co.id/images/payment_method/bri.png',
    'BNIVA': 'https://tripay.co.id/images/payment_method/bni.png',
    'BCAVA': 'https://tripay.co.id/images/payment_method/bca.png',
    'MANDIRIVA': 'https://tripay.co.id/images/payment_method/mandiri.png',
    'PERMATAVA': 'https://tripay.co.id/images/payment_method/permata.png',
    
    // E-Wallets
    'OVO': 'https://tripay.co.id/images/payment_method/ovo.png',
    'DANA': 'https://tripay.co.id/images/payment_method/dana.png',
    'SHOPEEPAY': 'https://tripay.co.id/images/payment_method/shopeepay.png',
    'GOPAY': 'https://tripay.co.id/images/payment_method/gopay.png',
    
    // QRIS
    'QRIS': 'https://tripay.co.id/images/payment_method/qris.png',
    'QRISC': 'https://tripay.co.id/images/payment_method/qris.png',
    
    // Convenience Store
    'ALFAMART': 'https://tripay.co.id/images/payment_method/alfamart.png',
    'INDOMARET': 'https://tripay.co.id/images/payment_method/indomaret.png',
  };
  
  return iconMap[code] || null;
};

// Dan di bagian render icon, tambahkan error handling yang lebih baik:
<div className="ml-3 flex-shrink-0 w-16 h-10 flex items-center justify-center bg-white rounded border border-gray-100">
  {iconUrl ? (
    <img 
      src={iconUrl}
      alt={channel.name}
      className="max-w-full max-h-full object-contain p-1"
      loading="lazy"
      onError={(e) => {
        console.warn('Failed to load payment icon:', channel.code, iconUrl);
        // Fallback ke emoji jika gambar gagal load
        e.target.style.display = 'none';
        const fallbackEmoji = e.target.nextSibling || document.createElement('span');
        fallbackEmoji.className = 'text-2xl';
        fallbackEmoji.textContent = '💳';
        if (!e.target.nextSibling) {
          e.target.parentElement.appendChild(fallbackEmoji);
        }
      }}
    />
  ) : (
    <span className="text-2xl">💳</span>
  )}
</div>

  // Kelompokkan payment channels
  const groupedPayments = paymentChannels.reduce((acc, channel) => {
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

  

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Metode Pembayaran</h2>
      
      <div className="space-y-4">
        {/* Payment Methods dengan Accordion */}
        <div className="space-y-3">
          {Object.keys(groupedPayments).length > 0 ? (
            Object.entries(groupedPayments).map(([category, channels]) => (
              <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{getCategoryIcon(category)}</span>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{category}</h3>
                      <p className="text-sm text-gray-500">
                        {channels.length} metode tersedia
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openCategories[category] ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Category Content */}
                {openCategories[category] && (
                  <div className="p-2 space-y-2">
                    {channels.map((channel) => {
                      const iconUrl = getPaymentIcon(channel);
                      
                      return (
                        <div 
                          key={channel.code}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${
                            selectedPaymentMethod === channel.code 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                          onClick={() => onPaymentMethodSelect(channel.code)}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={selectedPaymentMethod === channel.code}
                              onChange={() => onPaymentMethodSelect(channel.code)}
                              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 flex-shrink-0"
                            />
                            
                            {/* Logo Payment Method dari Tripay CDN */}
                            <div className="ml-3 flex-shrink-0 w-16 h-10 flex items-center justify-center bg-white rounded border border-gray-100">
                              {iconUrl ? (
                                <img 
                                  src={iconUrl}
                                  alt={channel.name}
                                  className="max-w-full max-h-full object-contain p-1"
                                  loading="lazy"
                                  onError={(e) => {
                                    console.error('Failed to load icon:', channel.code, iconUrl);
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<span class="text-2xl">💳</span>';
                                  }}
                                />
                              ) : (
                                <span className="text-2xl">💳</span>
                              )}
                            </div>
                            
                            <div className="ml-3 flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{channel.name}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {channel.group}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right ml-3 flex-shrink-0">
                            {channel.total_fee?.flat > 0 && (
                              <p className="text-xs text-green-600 font-semibold whitespace-nowrap">
                                +{formatCurrency(channel.total_fee.flat)}
                              </p>
                            )}
                            {channel.total_fee?.percent > 0 && (
                              <p className="text-xs text-green-600 font-semibold whitespace-nowrap">
                                +{channel.total_fee.percent}%
                              </p>
                            )}
                            {!channel.total_fee?.flat && !channel.total_fee?.percent && (
                              <p className="text-xs text-gray-400">Gratis</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat metode pembayaran...</p>
            </div>
          )}
        </div>

        {/* Info Tripay */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-blue-600 mr-3 text-xl">🔒</span>
            <div>
              <p className="text-blue-900 font-semibold text-sm mb-1">
                Pembayaran Aman dengan Tripay
              </p>
              <p className="text-blue-700 text-xs">
                Payment Gateway resmi dan terpercaya di Indonesia
              </p>
            </div>
          </div>
        </div>

        {/* Kode Kupon */}
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Punya Kode Kupon?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.kode_kupon}
              onChange={(e) => onInputChange('kode_kupon', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="Masukkan kode kupon"
            />
            <button 
              type="button"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
            >
              Terapkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Komponen OrderSummary
const OrderSummary = ({ cartItems, subtotal, shippingCost, total, currentStep, onPrevStep, onNextStep, isSubmitting }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Ringkasan Pesanan</h2>
      
      {/* Items List */}
      <div className="space-y-3 mb-4">
        {cartItems.map((item) => (
          <div key={item.id} className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900">{item.nama_produk}</p>
              <p className="text-xs text-gray-500">
                {formatCurrency(item.harga)} × {item.quantity}
              </p>
            </div>
            <p className="font-semibold text-gray-900 text-sm">
              {formatCurrency(item.harga * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 my-4"></div>

      {/* Pricing */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Biaya Pengiriman</span>
          <span className="text-gray-900">{formatCurrency(shippingCost)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-gray-900">Total</span>
          <span className="text-green-600">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 space-y-3">
        {currentStep > 1 && (
          <button
            onClick={onPrevStep}
            disabled={isSubmitting}
            className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50"
          >
            Kembali
          </button>
        )}
        
        <button
          onClick={onNextStep}
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Memproses...
            </div>
          ) : currentStep === 3 ? (
            'Buat Pesanan & Bayar'
          ) : (
            'Lanjutkan'
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;