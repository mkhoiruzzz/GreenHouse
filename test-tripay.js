const axios = require('axios');

async function testTripayAPI() {
  try {
    console.log('🧪 Testing Tripay API Route...');

    // Test 1: Cek apakah server berjalan
    console.log('1. Testing server connection...');
    try {
      const pingResponse = await axios.get('http://localhost:3000/api/tripay/payment-channels', {
        timeout: 5000
      });
      console.log('✅ Server is running');
    } catch (pingError) {
      console.log('❌ Server not running or API route not found');
      console.log('Error:', pingError.message);
      return;
    }

    // Test 2: Create transaction
    console.log('2. Testing create transaction...');
    const testData = {
      method: 'BRIVA',
      merchant_ref: 'TEST-' + Date.now(),
      amount: 100000,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '081234567890',
      order_items: [
        {
          name: 'Test Product',
          price: 100000,
          quantity: 1
        }
      ],
      return_url: 'https://green-house-mkhoiruzzzs-projects.vercel.app/checkout'
    };

    const response = await axios.post(
      'http://localhost:3000/api/tripay/create-transaction',
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Test Result:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test Failed:');
    console.log('Error Message:', error.message);
    console.log('Error Code:', error.code);
    console.log('Response Data:', error.response?.data);
    console.log('Response Status:', error.response?.status);
    console.log('Response Headers:', error.response?.headers);
  }
}

testTripayAPI();