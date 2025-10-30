// Checkout.jsx - Fixed product validation error
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import emailjs from '@emailjs/browser';
 import { supabase } from '../config/supabase';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Informasi Pembeli
    email: user?.email || '',
    subscribe_newsletter: false,
    nama_lengkap: user?.nama_lengkap || '',
    kota: '',
    alamat_pengiriman: '',
    kode_pos: '',
    no_telepon: user?.no_telepon || '',
    is_dropshipper: false,
    
    // Step 2: Metode Pengiriman
    metode_pengiriman: '',
    biaya_pengiriman: 0,
    
    // Step 3: Metode Pembayaran
    metode_pembayaran: 'transfer',
    kode_kupon: ''
  });

  const steps = [
    { number: 1, title: 'Informasi Pembeli' },
    { number: 2, title: 'Metode Pengiriman' },
    { number: 3, title: 'Metode Pembayaran' }
  ];

  // Fungsi untuk kirim email konfirmasi order - FIXED VERSION
  const sendOrderConfirmationEmail = async (orderData) => {
    try {
      console.log('📧 Preparing to send email confirmation...');
      
      // Validasi email
      if (!orderData.email || orderData.email.trim() === '') {
        console.error('❌ Email recipient is empty or invalid:', orderData.email);
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(orderData.email)) {
        console.error('❌ Invalid email format:', orderData.email);
        return false;
      }

      // Hitung subtotal, shipping, dan total
      const subtotal = orderData.items?.reduce((sum, item) => sum + (item.harga * item.quantity), 0) || 0;
      const shippingCost = orderData.biaya_pengiriman || 0;
      const grandTotal = subtotal + shippingCost;

      // Format data sesuai dengan template email
      const templateParams = {
        to_email: orderData.email.trim(),
        to_name: orderData.nama_lengkap?.trim() || 'Pelanggan',
        customer_name: orderData.nama_lengkap?.trim() || 'Pelanggan',
        order_id: orderData.orderId?.toString() || 'N/A',
        order_date: new Date().toLocaleDateString('id-ID'),
        
        // VARIABEL HARGA
        subtotal: `Rp ${subtotal.toLocaleString('id-ID')}`,
        shipping_cost: `Rp ${shippingCost.toLocaleString('id-ID')}`,
        grand_total: `Rp ${grandTotal.toLocaleString('id-ID')}`,
        
        // VARIABEL ALAMAT - SEMUA DIPISAH
        shipping_address: orderData.alamat_pengiriman?.trim() || 'Alamat tidak tersedia',
        kota: orderData.kota || '',
        kode_pos: orderData.kode_pos || '',
        
        payment_method: orderData.metode_pembayaran || 'Transfer Bank',
        shipping_method: orderData.metode_pengiriman || 'Reguler',
        order_items: orderData.items?.map(item => 
          `${item.nama_produk || 'Product'} - ${item.quantity} x Rp ${(item.harga || 0).toLocaleString('id-ID')}`
        ).join(', ') || 'Tidak ada items',
        phone_number: orderData.no_telepon || '-',
        customer_email: orderData.email.trim()
      };

      console.log('📨 Final email params:', templateParams);

      const requiredFields = ['to_email', 'customer_name', 'order_id'];
      const missingFields = requiredFields.filter(field => !templateParams[field]);
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        return false;
      }

      const serviceID = 'service_t9g74el';
      const templateID = 'template_oldo1ke'; 
      const publicKey = 'tAM6BbqC9NJgJnfc_';

      console.log('🚀 Sending email via EmailJS...');
      const result = await emailjs.send(serviceID, templateID, templateParams, publicKey);
      
      console.log('✅ Email konfirmasi order terkirim:', result);
      return true;
      
    } catch (error) {
      console.error('❌ Gagal kirim email konfirmasi:', error);
      
      if (error.text) {
        console.error('Error details:', error.text);
      }
      if (error.status) {
        console.error('Error status:', error.status);
      }
      
      return false;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNextStep = () => {
    // Validasi step
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
    
    if (currentStep === 3 && !formData.metode_pembayaran) {
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
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };



// ✅ GANTI DENGAN FUNGSI REAL YANG SAVE KE SUPABASE
const createOrderInSupabase = async (orderData) => {
  try {
    console.log('🛒 Creating order in Supabase:', orderData);
    
    // 1. BUAT ORDER DI TABLE orders
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: orderData.user_id,
        total_harga: orderData.total_harga,
        biaya_pengiriman: orderData.biaya_pengiriman,
        status_pembayaran: 'pending',
        status_pengiriman: 'pending',
        metode_pembayaran: orderData.metode_pembayaran,
        alamat_pengiriman: orderData.alamat_pengiriman,
        catatan: orderData.catatan || ''
      }])
      .select();

    if (orderError) throw orderError;
    if (!order || order.length === 0) throw new Error('Order creation failed');

    const orderId = order[0].id;
    console.log('✅ Order created with ID:', orderId);

    // 2. BUAT ORDER ITEMS DI TABLE order_items
    const orderItemsData = orderData.items.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      harga_satuan: item.harga
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) throw itemsError;

    console.log('✅ Order items created successfully');

    return { 
      success: true, 
      orderId: orderId, // ✅ ID ASLI DARI DATABASE
      message: 'Pesanan berhasil dibuat' 
    };

  } catch (error) {
    console.error('❌ Error creating order:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'Gagal membuat pesanan: ' + error.message
    };
  }
};
  // PERBAIKAN UTAMA: Fix handlePlaceOrder function
  const handlePlaceOrder = async () => {
    try {
      setIsSubmitting(true);

      // Validasi email
      if (!formData.email || formData.email.trim() === '') {
        toast.error('Email harus diisi untuk menerima konfirmasi');
        setIsSubmitting(false);
        return;
      }

      // Format order items
      const orderItems = cartItems.map(item => {
        const productId = item.product_id || item.id;
        
        return {
          product_id: parseInt(productId) || 1,
          quantity: parseInt(item.quantity) || 1,
          harga: parseFloat(item.harga) || 0,
          nama_produk: item.nama_produk || 'Product'
        };
      });

      console.log('📦 Formatted order items:', orderItems);

      // Validasi items
      const invalidItems = orderItems.filter(item => 
        !item.product_id || item.product_id === 0 || isNaN(item.product_id)
      );
      
      if (invalidItems.length > 0) {
        console.error('❌ Invalid items found:', invalidItems);
        toast.error('Data produk tidak valid. Silakan refresh keranjang Anda.');
        setIsSubmitting(false);
        return;
      }

      // Di handlePlaceOrder - tambahkan setelah order created
console.log('🔄 Checking if order saved in database...');

// Test query order dari Supabase
const { data: savedOrder, error } = await supabase
  .from('orders')
  .select('*')
  .eq('id', result.orderId)
  .single();

console.log('✅ Order in database:', savedOrder);
console.log('❌ Error:', error);

      // Siapkan payload untuk Supabase
      const orderPayload = {
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        items: orderItems,
        total_harga: calculateSubtotal(),
        biaya_pengiriman: formData.biaya_pengiriman || 0,
        metode_pembayaran: formData.metode_pembayaran || 'transfer',
        alamat_pengiriman: formData.alamat_pengiriman,
        // Data tambahan untuk database
        nama_lengkap: formData.nama_lengkap || '',
        email: formData.email || '',
        no_telepon: formData.no_telepon || '',
        kota: formData.kota || ''
      };

      console.log('🛒 Final order payload for Supabase:', orderPayload);

      // Gunakan Supabase untuk create order
      const result = await createOrderInSupabase(orderPayload);

      if (result.success) {
        console.log('✅ Order created successfully:', result.orderId);
        
        // Kirim email konfirmasi
        try {
          const emailSent = await sendOrderConfirmationEmail({
            ...formData,
            items: cartItems,
            orderId: result.orderId
          });

          if (emailSent) {
            toast.success('🎉 Pesanan berhasil dibuat! Email konfirmasi telah dikirim.');
          } else {
            toast.success('🎉 Pesanan berhasil dibuat! (Email konfirmasi gagal dikirim)');
          }
        } catch (emailError) {
          console.error('Email error:', emailError);
          toast.success('🎉 Pesanan berhasil dibuat!');
        }

        // Clear cart dan redirect
        clearCart();
        navigate('/orders/success', { 
          state: { 
            orderId: result.orderId
          } 
        });
      } else {
        console.error('❌ Order creation failed:', result.error);
        toast.error(result.message || 'Gagal membuat pesanan');
      }
    } catch (error) {
      console.error('❌ Error placing order:', error);
      toast.error('❌ Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.harga * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + formData.biaya_pengiriman;
  };

  if (cartItems.length === 0) {
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

  return (
    <div className="min-h-screen mt-16 bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Selesaikan pembelian Anda dalam 3 langkah mudah</p>
        </div>

        {/* Progress Steps */}
       {/* Progress Steps - RESPONSIVE FIX */}
<div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
  {/* Desktop View */}
  <div className="hidden md:flex items-center justify-between">
    {steps.map((step, index) => (
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
        {index < steps.length - 1 && (
          <div className={`w-16 h-0.5 mx-4 ${
            currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'
          }`} />
        )}
      </div>
    ))}
  </div>

  {/* Mobile View */}
  <div className="md:hidden">
    {/* Step Numbers */}
    <div className="flex justify-between items-center mb-4">
      {steps.map((step) => (
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
    
    {/* Progress Bar */}
    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
      <div 
        className="bg-green-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
      ></div>
    </div>
    
    {/* Current Step Title */}
    <div className="text-center">
      <span className="text-sm font-medium text-green-600">
        Langkah {currentStep}: {steps.find(step => step.number === currentStep)?.title}
      </span>
    </div>
  </div>
</div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <InformasiPembeli 
                formData={formData} 
                onInputChange={handleInputChange} 
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
              />
            )}
          </div>

          {/* Order Summary */}
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
        </div>
      </div>
    </div>
  );
};

// Fungsi untuk menentukan zona pengiriman berdasarkan kota
const getShippingZone = (kota) => {
  if (!kota) return 'luar_jawa';
  
  const kotaLower = kota.toLowerCase();
  
  // Zona Jawa Tengah
  const jatengCities = ['semarang', 'solo', 'surakarta', 'magelang', 'salatiga', 'pekalongan', 'tegal', 'purwokerto', 'cilacap', 'klaten', 'boyolali', 'sukoharjo', 'wonogiri', 'kebumen', 'purworejo', 'temanggung', 'kendal', 'batang', 'blora', 'rembang', 'pati', 'kudus', 'jepara', 'demak', 'grobogan', 'sragen', 'karanganyar', 'wonosobo', 'maguwoharjo', 'yogyakarta'];
  
  // Zona Jawa Barat
  const jabarCities = ['bandung', 'bekasi', 'bogor', 'depok', 'sukabumi', 'cimahi', 'tasikmalaya', 'cirebon', 'garut', 'cianjur', 'subang', 'sumedang', 'indramayu', 'karawang', 'purwakarta', 'banjar', 'majalengka', 'pangandaran', 'cilegon', 'serang', 'tangerang', 'tangerang selatan', 'south tangerang'];
  
  // Zona Jawa Timur
  const jatimCities = ['surabaya', 'malang', 'sidoarjo', 'mojokerto', 'jember', 'banyuwangi', 'madiun', 'kediri', 'blitar', 'pasuruan', 'probolinggo', 'lumajang', 'bondowoso', 'situbondo', 'tulungagung', 'trenggalek', 'nganjuk', 'magetan', 'ponorogo', 'pacitan', 'gresik', 'lamongan', 'tuban', 'bojonegoro', 'ngawi', 'batu', 'pamekasan', 'sampang', 'sumenep', 'bangil'];
  
  // Cek zona
  if (jatengCities.some(city => kotaLower.includes(city))) {
    return 'jawa_tengah';
  }
  if (jabarCities.some(city => kotaLower.includes(city))) {
    return 'jawa_barat';
  }
  if (jatimCities.some(city => kotaLower.includes(city))) {
    return 'jawa_timur';
  }
  if (kotaLower.includes('jakarta') || kotaLower.includes('banten')) {
    return 'jabodetabek';
  }
  
  return 'luar_jawa';
};

// Fungsi untuk mendapatkan estimasi pengiriman berdasarkan zona dan kurir
const getShippingEstimation = (zone, courier) => {
  const estimations = {
    jabodetabek: {
      jne: '1-2 hari',
      tiki: '1 hari',
      pos: '2-3 hari',
      jnt: '1-2 hari'
    },
    jawa_barat: {
      jne: '2-3 hari',
      tiki: '1-2 hari',
      pos: '3-4 hari',
      jnt: '2-3 hari'
    },
    jawa_tengah: {
      jne: '2-3 hari',
      tiki: '2 hari',
      pos: '3-4 hari',
      jnt: '2-3 hari'
    },
    jawa_timur: {
      jne: '3-4 hari',
      tiki: '2-3 hari',
      pos: '4-5 hari',
      jnt: '3-4 hari'
    },
    luar_jawa: {
      jne: '5-7 hari',
      tiki: '4-6 hari',
      pos: '7-10 hari',
      jnt: '5-8 hari'
    }
  };
  
  return estimations[zone]?.[courier] || '4-7 hari';
};

// Fungsi untuk mendapatkan biaya pengiriman berdasarkan zona dan kurir
const getShippingCost = (zone, courier) => {
  const costs = {
    jabodetabek: {
      jne: 10000,
      tiki: 15000,
      pos: 8000,
      jnt: 12000
    },
    jawa_barat: {
      jne: 12000,
      tiki: 18000,
      pos: 10000,
      jnt: 15000
    },
    jawa_tengah: {
      jne: 15000,
      tiki: 20000,
      pos: 12000,
      jnt: 17000
    },
    jawa_timur: {
      jne: 18000,
      tiki: 25000,
      pos: 15000,
      jnt: 20000
    },
    luar_jawa: {
      jne: 25000,
      tiki: 35000,
      pos: 20000,
      jnt: 30000
    }
  };
  
  return costs[zone]?.[courier] || 20000;
};

// Step 1 Component - Match dengan database fields
const InformasiPembeli = ({ formData, onInputChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Informasi Pembeli</h2>
      
      <div className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="email@example.com"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Email konfirmasi akan dikirim ke alamat ini</p>
        </div>

        {/* Newsletter */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.subscribe_newsletter}
            onChange={(e) => onInputChange('subscribe_newsletter', e.target.checked)}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label className="ml-2 text-sm text-gray-700">Berlangganan newsletter</label>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        <h3 className="font-semibold text-gray-900 mb-3">Alamat Pengiriman</h3>

        {/* Nama Lengkap */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nama_lengkap}
            onChange={(e) => onInputChange('nama_lengkap', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="John Doe"
            required
          />
        </div>

        {/* Kota */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kota/Kabupaten <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.kota}
            onChange={(e) => onInputChange('kota', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Jakarta Pusat"
            required
          />
        </div>

        {/* Alamat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alamat Lengkap <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.alamat_pengiriman}
            onChange={(e) => onInputChange('alamat_pengiriman', e.target.value)}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Jl. Contoh No. 123, RT/RW, Kelurahan, Kecamatan"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Kode Pos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kode Pos</label>
            <input
              type="text"
              value={formData.kode_pos}
              onChange={(e) => onInputChange('kode_pos', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="12345"
            />
          </div>

          {/* Telepon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telepon <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.no_telepon}
              onChange={(e) => onInputChange('no_telepon', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="+628123456789"
              required
            />
          </div>
        </div>

        {/* Dropshipper */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_dropshipper}
            onChange={(e) => onInputChange('is_dropshipper', e.target.checked)}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label className="ml-2 text-sm text-gray-700">Kirim sebagai dropshipper</label>
        </div>
      </div>
    </div>
  );
};

// Step 2 Component - UPDATED WITH SMART SHIPPING
const MetodePengiriman = ({ formData, onInputChange }) => {
  // Tentukan zona berdasarkan kota yang diinput user
  const shippingZone = getShippingZone(formData.kota);
  
  const shippingMethods = [
    { 
      id: 'jne', 
      name: 'JNE Reguler', 
      basePrice: 15000,
      estimasi: getShippingEstimation(shippingZone, 'jne'),
      price: getShippingCost(shippingZone, 'jne')
    },
    { 
      id: 'tiki', 
      name: 'TIKI Reguler', 
      basePrice: 20000,
      estimasi: getShippingEstimation(shippingZone, 'tiki'),
      price: getShippingCost(shippingZone, 'tiki')
    },
    { 
      id: 'pos', 
      name: 'POS Indonesia', 
      basePrice: 10000,
      estimasi: getShippingEstimation(shippingZone, 'pos'),
      price: getShippingCost(shippingZone, 'pos')
    },
    { 
      id: 'jnt', 
      name: 'J&T Express', 
      basePrice: 12000,
      estimasi: getShippingEstimation(shippingZone, 'jnt'),
      price: getShippingCost(shippingZone, 'jnt')
    }
  ];

  const handleShippingSelect = (method) => {
    onInputChange('metode_pengiriman', method.id);
    onInputChange('biaya_pengiriman', method.price);
  };

  // Dapatkan nama zona untuk ditampilkan
  const getZoneName = (zone) => {
    const zoneNames = {
      'jabodetabek': 'Jabodetabek',
      'jawa_barat': 'Jawa Barat', 
      'jawa_tengah': 'Jawa Tengah & DIY',
      'jawa_timur': 'Jawa Timur',
      'luar_jawa': 'Luar Jawa'
    };
    return zoneNames[zone] || 'Luar Jawa';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Metode Pengiriman</h2>
      
      {/* Info Zona Pengiriman */}
      {formData.kota && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-800">Zona Pengiriman: {getZoneName(shippingZone)}</p>
              <p className="text-sm text-blue-600">
                Kota: {formData.kota} 
                {shippingZone === 'luar_jawa' && (
                  <span className="ml-2 text-orange-600 font-medium">(Estimasi lebih lama)</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Biaya dan estimasi sudah disesuaikan</p>
            </div>
          </div>
        </div>
      )}

      {/* Warning untuk kota belum diisi */}
      {!formData.kota && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ Masukkan kota terlebih dahulu untuk melihat estimasi pengiriman yang akurat
          </p>
        </div>
      )}

      <div className="space-y-3">
        {shippingMethods.map((method) => (
          <div 
            key={method.id} 
            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${
              formData.metode_pengiriman === method.id 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-green-300'
            }`}
            onClick={() => handleShippingSelect(method)}
          >
            <div className="flex items-center">
              <input
                type="radio"
                name="shippingMethod"
                checked={formData.metode_pengiriman === method.id}
                onChange={() => handleShippingSelect(method)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <div className="ml-3">
                <p className="font-medium text-gray-900">{method.name}</p>
                <p className="text-sm text-gray-500">
                  Estimasi: {method.estimasi}
                  {formData.kota && shippingZone === 'luar_jawa' && (
                    <span className="ml-1 text-orange-500">⏳</span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatCurrency(method.price)}</p>
              {method.price !== method.basePrice && (
                <p className="text-xs text-gray-500 line-through">
                  {formatCurrency(method.basePrice)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend Estimasi */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">📦 Informasi Estimasi:</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>• Jabodetabek: 1-2 hari</div>
          <div>• Jawa Barat: 2-3 hari</div>
          <div>• Jateng & DIY: 2-3 hari</div>
          <div>• Jawa Timur: 3-4 hari</div>
          <div>• Luar Jawa: 5-10 hari</div>
        </div>
      </div>
    </div>
  );
};

// Step 3 Component
const MetodePembayaran = ({ formData, onInputChange }) => {
  const paymentMethods = [
    { id: 'transfer', name: 'Transfer Bank', icon: '🏦' },
    { id: 'cod', name: 'COD (Bayar di Tempat)', icon: '💵' },
    { id: 'ewallet', name: 'E-Wallet', icon: '📱' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Metode Pembayaran</h2>
      
      <div className="space-y-4">
        {/* Payment Methods */}
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div 
              key={method.id} 
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${
                formData.metode_pembayaran === method.id 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-green-300'
              }`}
              onClick={() => onInputChange('metode_pembayaran', method.id)}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={formData.metode_pembayaran === method.id}
                  onChange={() => onInputChange('metode_pembayaran', method.id)}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="ml-3 text-lg">{method.icon}</span>
                <span className="ml-2 font-medium text-gray-900">{method.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Kode Kupon */}
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Kode Kupon</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.kode_kupon}
              onChange={(e) => onInputChange('kode_kupon', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Masukkan kode kupon"
            />
            <button 
              type="button"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Cari
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Order Summary Component
const OrderSummary = ({ cartItems, subtotal, shippingCost, total, currentStep, onPrevStep, onNextStep, isSubmitting }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-24">
      <h3 className="font-semibold text-lg text-gray-900 mb-4">Ringkasan Pesanan</h3>
      
      {/* Cart Items */}
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
        {cartItems.map((item) => (
          <div key={item.id} className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900">{item.nama_produk}</p>
              <p className="text-xs text-gray-500">{formatCurrency(item.harga)} × {item.quantity}</p>
            </div>
            <p className="font-semibold text-gray-900 text-sm">
              {formatCurrency(item.harga * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Cost Breakdown */}
      <div className="space-y-2 mb-4">
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
      <div className="space-y-3">
        {currentStep > 1 && (
          <button
            onClick={onPrevStep}
            disabled={isSubmitting}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50"
          >
            Kembali
          </button>
        )}
        
        <button
          onClick={onNextStep}
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memproses...
            </>
          ) : (
            currentStep === 3 ? 'Buat Pesanan' : 'Lanjutkan'
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;