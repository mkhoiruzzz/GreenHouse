import axios from 'axios';

// Base URL untuk API routes - FIX untuk production
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://green-house-mkhoiruzzzs-projects.vercel.app/api/tripay'
  : 'http://localhost:3000/api/tripay';

console.log('🔧 Tripay Service Config:', {
  baseURL: API_BASE_URL,
  environment: process.env.NODE_ENV
});

// URL base untuk gambar payment method - FIX CONSISTENCY
const PAYMENT_ICON_BASE_URL = 'https://tripay.co.id/images/payment_method';

export const tripayService = {
  // Get payment channels via API route dengan icon URL yang konsisten
  getPaymentChannels: async () => {
    try {
      console.log('📋 Fetching payment channels via API route...');
      
      const response = await axios.get(`${API_BASE_URL}/payment-channels`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Payment channels loaded:', response.data.data?.length || 0);
      
      // ✅ FIX: Konsistenkan URL gambar payment method
      const channelsWithFixedIcons = (response.data.data || []).map(channel => {
        // Gunakan icon URL yang konsisten dari Tripay CDN
        const fixedIconUrl = channel.icon_url && channel.icon_url.includes('tripay.co.id')
          ? channel.icon_url
          : getPaymentIconUrl(channel.code);
          
        return {
          ...channel,
          icon_url: fixedIconUrl // Pastikan selalu ada URL yang valid
        };
      });
      
      return {
        success: response.data.success,
        data: channelsWithFixedIcons
      };
    } catch (error) {
      console.error('❌ Error fetching payment channels:', error.response?.data || error.message);
      
      // Fallback dengan icon URL yang konsisten
      return {
        success: false,
        error: error.response?.data || error.message,
        data: getFallbackChannels()
      };
    }
  },

  // Create REAL transaction via API route
  createTransaction: async (transactionData) => {
    try {
      console.log('💰 Creating REAL transaction via API route...');
      console.log('Transaction data:', {
        ...transactionData,
        order_items: transactionData.order_items?.length || 0
      });

      const response = await axios.post(
        `${API_BASE_URL}/create-transaction`,
        transactionData,
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ REAL Transaction created:', response.data.data?.reference);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.message || 'Gagal membuat transaksi');
      }

    } catch (error) {
      console.error('❌ Error creating REAL transaction:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Gagal membuat transaksi pembayaran'
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
          timeout: 10000,
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
        error: error.response?.data || error.message
      };
    }
  }
};

// ✅ FIX: Function untuk mendapatkan URL icon yang konsisten
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

// Fallback payment channels dengan icon URL yang konsisten
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
    }
  ];
}

export default tripayService;
