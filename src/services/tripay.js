import axios from 'axios';

// ✅ FIX: Gunakan relative path untuk API routes di Vercel
const API_BASE_URL = '/api/tripay';

console.log('🔧 Tripay Service Config:', {
  baseURL: API_BASE_URL,
  environment: process.env.NODE_ENV
});

// URL base untuk gambar payment method
const PAYMENT_ICON_BASE_URL = 'https://tripay.co.id/images/payment_method';

export const tripayService = {
  // Get payment channels via API route
  getPaymentChannels: async () => {
    try {
      console.log('📋 Fetching payment channels via API route...');
      
      // Check if running on localhost - use fallback immediately
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🏠 Running on localhost - using fallback channels');
        return {
          success: true,
          data: getFallbackChannels(),
          message: 'Using fallback payment channels (localhost)'
        };
      }
      
      const response = await axios.get(`${API_BASE_URL}/payment-channels`, {
        timeout: 5000, // Reduced timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Payment channels loaded:', response.data.data?.length || 0);
      
      // Fix icon URLs
      const channelsWithFixedIcons = (response.data.data || []).map(channel => {
        const fixedIconUrl = channel.icon_url && channel.icon_url.includes('tripay.co.id')
          ? channel.icon_url
          : getPaymentIconUrl(channel.code);
          
        return {
          ...channel,
          icon_url: fixedIconUrl
        };
      });
      
      return {
        success: response.data.success || true,
        data: channelsWithFixedIcons
      };
    } catch (error) {
      console.error('❌ Error fetching payment channels:', error.response?.data || error.message);
      console.log('🔄 Using fallback payment channels...');
      
      // Return fallback channels instead of failing
      return {
        success: true,
        data: getFallbackChannels(),
        message: 'Using fallback payment channels'
      };
    }
  },

  // Create transaction via API route
  createTransaction: async (transactionData) => {
    try {
      console.log('💰 Creating transaction via API route...');
      console.log('Transaction data:', {
        method: transactionData.method,
        amount: transactionData.amount,
        items: transactionData.order_items?.length || 0
      });

      // ✅ FIX: Check if running on localhost - use mock payment
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.port === '3000' ||
                         window.location.port === '5173'; // Vite default port
      
      if (isLocalhost) {
        console.log('🏠 Running on localhost - using MOCK payment');
        const mockReference = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Mock payment created:', mockReference);
        
        return {
          success: true,
          data: {
            reference: mockReference,
            merchant_ref: transactionData.merchant_ref,
            payment_method: transactionData.method,
            payment_name: `Mock Payment - ${transactionData.method}`,
            amount: transactionData.amount,
            checkout_url: '#', // Mock - will trigger success flow
            status: 'UNPAID',
            expired_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString()
          },
          message: 'Mock payment created (localhost mode)'
        };
      }

      // Real API call for production
      const response = await axios.post(
        `${API_BASE_URL}/create-transaction`,
        transactionData,
        {
          timeout: 20000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Transaction created:', response.data.data?.reference);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.message || 'Gagal membuat transaksi');
      }

    } catch (error) {
      console.error('❌ Error creating transaction:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // If not localhost and API fails, return error
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.port === '3000' ||
                         window.location.port === '5173';
      
      if (!isLocalhost) {
        return {
          success: false,
          error: error.response?.data || error.message,
          message: error.response?.data?.message || 'Gagal membuat transaksi pembayaran'
        };
      }
      
      // Fallback mock for localhost if error occurs
      console.log('⚠️ Error occurred, using fallback mock payment');
      const mockReference = `MOCK-FALLBACK-${Date.now()}`;
      
      return {
        success: true,
        data: {
          reference: mockReference,
          merchant_ref: transactionData.merchant_ref,
          payment_method: transactionData.method,
          amount: transactionData.amount,
          checkout_url: '#',
          status: 'UNPAID'
        },
        message: 'Using mock payment (fallback)'
      };
    }
  },

  // Check transaction via API route
  checkTransaction: async (reference) => {
    try {
      console.log('🔍 Checking transaction via API route:', reference);
      
      const response = await axios.get(
        `${API_BASE_URL}/check-transaction?reference=${reference}`,
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Transaction status:', response.data.data?.status);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.message || 'Gagal memeriksa status transaksi');
      }

    } catch (error) {
      console.error('❌ Error checking transaction:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Gagal memeriksa status transaksi'
      };
    }
  }
};

// Function untuk mendapatkan URL icon yang konsisten
function getPaymentIconUrl(code) {
  const iconMap = {
    // Virtual Accounts
    'BRIVA': `${PAYMENT_ICON_BASE_URL}/bri.png`,
    'BNIVA': `${PAYMENT_ICON_BASE_URL}/bni.png`,
    'BCAVA': `${PAYMENT_ICON_BASE_URL}/bca.png`,
    'MANDIRIVA': `${PAYMENT_ICON_BASE_URL}/mandiri.png`,
    'PERMATAVA': `${PAYMENT_ICON_BASE_URL}/permata.png`,
    'BSIVA': `${PAYMENT_ICON_BASE_URL}/bsi.png`,
    'SMSVA': `${PAYMENT_ICON_BASE_URL}/sinarmas.png`,
    'MUAMALATVA': `${PAYMENT_ICON_BASE_URL}/muamalat.png`,
    'CIMBVA': `${PAYMENT_ICON_BASE_URL}/cimb.png`,
    
    // E-Wallets
    'OVO': `${PAYMENT_ICON_BASE_URL}/ovo.png`,
    'DANA': `${PAYMENT_ICON_BASE_URL}/dana.png`,
    'SHOPEEPAY': `${PAYMENT_ICON_BASE_URL}/shopeepay.png`,
    'LINKAJA': `${PAYMENT_ICON_BASE_URL}/linkaja.png`,
    'GOPAY': `${PAYMENT_ICON_BASE_URL}/gopay.png`,
    
    // QRIS
    'QRIS': `${PAYMENT_ICON_BASE_URL}/qris.png`,
    'QRISC': `${PAYMENT_ICON_BASE_URL}/qris.png`,
    'QRIS2': `${PAYMENT_ICON_BASE_URL}/qris.png`,
    
    // Convenience Store
    'ALFAMART': `${PAYMENT_ICON_BASE_URL}/alfamart.png`,
    'INDOMARET': `${PAYMENT_ICON_BASE_URL}/indomaret.png`,
    
    // Default fallback
    'default': `${PAYMENT_ICON_BASE_URL}/default.png`
  };

  return iconMap[code] || iconMap['default'];
}

// Fallback payment channels
function getFallbackChannels() {
  return [
    {
      code: 'BRIVA',
      name: 'BRI Virtual Account',
      group: 'Virtual Account',
      icon_url: getPaymentIconUrl('BRIVA'),
      active: true,
      fee_merchant: { flat: 0, percent: 0 },
      fee_customer: { flat: 4000, percent: 0 },
      total_fee: { flat: 4000, percent: 0 }
    },
    {
      code: 'BNIVA',
      name: 'BNI Virtual Account',
      group: 'Virtual Account',
      icon_url: getPaymentIconUrl('BNIVA'),
      active: true,
      fee_merchant: { flat: 0, percent: 0 },
      fee_customer: { flat: 4000, percent: 0 },
      total_fee: { flat: 4000, percent: 0 }
    },
    {
      code: 'BCAVA',
      name: 'BCA Virtual Account',
      group: 'Virtual Account',
      icon_url: getPaymentIconUrl('BCAVA'),
      active: true,
      fee_merchant: { flat: 0, percent: 0 },
      fee_customer: { flat: 4000, percent: 0 },
      total_fee: { flat: 4000, percent: 0 }
    },
    {
      code: 'MANDIRIVA',
      name: 'Mandiri Virtual Account',
      group: 'Virtual Account',
      icon_url: getPaymentIconUrl('MANDIRIVA'),
      active: true,
      fee_merchant: { flat: 0, percent: 0 },
      fee_customer: { flat: 4000, percent: 0 },
      total_fee: { flat: 4000, percent: 0 }
    },
    {
      code: 'PERMATAVA',
      name: 'Permata Virtual Account',
      group: 'Virtual Account',
      icon_url: getPaymentIconUrl('PERMATAVA'),
      active: true,
      fee_merchant: { flat: 0, percent: 0 },
      fee_customer: { flat: 4000, percent: 0 },
      total_fee: { flat: 4000, percent: 0 }
    },
    {
      code: 'OVO',
      name: 'OVO',
      group: 'E-Wallet',
      icon_url: getPaymentIconUrl('OVO'),
      active: true,
      fee_merchant: { flat: 0, percent: 0 },
      fee_customer: { flat: 0, percent: 1.5 },
      total_fee: { flat: 0, percent: 1.5 }
    },
    {
      code: 'DANA',
      name: 'DANA',
      group: 'E-Wallet',
      icon_url: getPaymentIconUrl('DANA'),
      active: true,
      fee_merchant: { flat: 0, percent: 0 },
      fee_customer: { flat: 0, percent: 1.5 },
      total_fee: { flat: 0, percent: 1.5 }
    },
    {
      code: 'SHOPEEPAY',
      name: 'ShopeePay',
      group: 'E-Wallet',
      icon_url: getPaymentIconUrl('SHOPEEPAY'),
      active: true,
      fee_merchant: { flat: 0, percent: 0 },
      fee_customer: { flat: 0, percent: 1.5 },
      total_fee: { flat: 0, percent: 1.5 }
    },
    {
      code: 'QRIS',
      name: 'QRIS (Semua E-Wallet)',
      group: 'QR Code',
      icon_url: getPaymentIconUrl('QRIS'),
      active: true,
      fee_merchant: { flat: 0, percent: 0 },
      fee_customer: { flat: 0, percent: 0.7 },
      total_fee: { flat: 0, percent: 0.7 }
    },
    {
      code: 'ALFAMART',
      name: 'Alfamart',
      group: 'Convenience Store',
      icon_url: getPaymentIconUrl('ALFAMART'),
      active: true,
      fee_merchant: { flat: 0, percent: 0 },
      fee_customer: { flat: 2500, percent: 0 },
      total_fee: { flat: 2500, percent: 0 }
    },
    {
      code: 'INDOMARET',
      name: 'Indomaret',
      group: 'Convenience Store',
      icon_url: getPaymentIconUrl('INDOMARET'),
      active: true,
      fee_merchant: { flat: 0, percent: 0 },
      fee_customer: { flat: 2500, percent: 0 },
      total_fee: { flat: 2500, percent: 0 }
    }
  ];
}

export default tripayService;