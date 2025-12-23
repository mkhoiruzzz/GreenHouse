// api/lib/fonnte.js
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const FONNTE_URL = 'https://api.fonnte.com/send';

export async function sendWhatsAppMessage(target, message) {
  try {
    const response = await fetch(FONNTE_URL, {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: target, // nomor WA (62xxx)
        message: message,
        countryCode: '62'
      })
    });

    const result = await response.json();
    console.log('✅ WhatsApp sent:', result);
    return result;
  } catch (error) {
    console.error('❌ WhatsApp error:', error);
    throw error;
  }
}

export function formatPaymentSuccessMessage(order, customerName) {
  return `🎉 *Pembayaran Berhasil!*

Halo *${customerName}*,

Pembayaran Anda telah kami terima!

📋 *Detail Pesanan:*
- No. Order: ${order.id}
- Total: Rp ${order.total_harga?.toLocaleString('id-ID')}
- Status: ✅ Lunas

📦 *Pesanan Anda sedang diproses*
Kami akan segera mengirimkan produk Anda.

Terima kasih sudah berbelanja di GreenHouse! 🌱

_Pesan otomatis - Jangan balas pesan ini_`;
}