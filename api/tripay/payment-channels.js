import axios from 'axios';

const TRIPAY_API_KEY = process.env.VITE_TRIPAY_API_KEY;
const TRIPAY_MODE = process.env.VITE_TRIPAY_MODE || 'sandbox';

const TRIPAY_API_URL = TRIPAY_MODE === 'production' 
  ? 'https://tripay.co.id/api' 
  : 'https://tripay.co.id/api-sandbox';

const PAYMENT_ICON_BASE_URL = 'https://tripay.co.id/images/payment_method';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Fetching payment channels from Tripay...');

    const response = await axios.get(`${TRIPAY_API_URL}/merchant/payment-channel`, {
      headers: {
        'Authorization': `Bearer ${TRIPAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Payment channels fetched successfully');

    const channelsWithValidIcons = (response.data.data || []).map(channel => {
      const validIconUrl = channel.icon_url && channel.icon_url.includes('tripay.co.id')
        ? channel.icon_url
        : `${PAYMENT_ICON_BASE_URL}/${getIconFilename(channel.code)}.png`;
      
      return {
        ...channel,
        icon_url: validIconUrl
      };
    });

    return res.status(200).json({
      success: true,
      data: channelsWithValidIcons
    });

  } catch (error) {
    console.error('❌ Error fetching payment channels:', error.response?.data || error.message);
    
    const fallbackChannels = [
      {
        code: 'BRIVA',
        name: 'BRI Virtual Account',
        group: 'Virtual Account',
        icon_url: `${PAYMENT_ICON_BASE_URL}/bri.png`,
        active: true,
        fee_merchant: { flat: 0, percent: 0 },
        fee_customer: { flat: 4000, percent: 0 },
        total_fee: { flat: 4000, percent: 0 }
      }
    ];

    return res.status(200).json({
      success: true,
      data: fallbackChannels,
      message: 'Using fallback data'
    });
  }
}

function getIconFilename(code) {
  const iconMap = {
    'BRIVA': 'bri',
    'BNIVA': 'bni',
    'BCAVA': 'bca',
    'MANDIRIVA': 'mandiri',
    'PERMATAVA': 'permata',
    'BSIVA': 'bsi',
    'OVO': 'ovo',
    'DANA': 'dana',
    'SHOPEEPAY': 'shopeepay',
    'GOPAY': 'gopay',
    'QRIS': 'qris',
    'ALFAMART': 'alfamart',
    'INDOMARET': 'indomaret'
  };
  
  return iconMap[code] || 'default';
}