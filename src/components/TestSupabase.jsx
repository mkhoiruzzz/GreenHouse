// src/components/TestSupabase.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const TestSupabase = () => {
  const [status, setStatus] = useState('Testing connection...');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔗 Testing Supabase connection...');
        setStatus('Connecting to database...');

        // Test connection dengan mengambil data products
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(5);

        if (error) {
          console.error('❌ Supabase error:', error);
          setStatus(`Error: ${error.message}`);
          return;
        }

        console.log('✅ SUPABASE CONNECTED SUCCESSFULLY!');
        console.log('📦 Products found:', data.length);
        console.log('Sample product:', data[0]);
        
        setStatus(`✅ Connected! Found ${data.length} products`);
        setProducts(data);
        
      } catch (error) {
        console.error('💥 Connection failed:', error);
        setStatus(`❌ Failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      background: '#f8f9fa',
      border: '2px solid #dee2e6',
      borderRadius: '8px'
    }}>
      <h2>🧪 Supabase Connection Test</h2>
      <p><strong>Status:</strong> {status}</p>
      
      {loading && <p>🔄 Loading...</p>}
      
      {products.length > 0 && (
        <div>
          <h3>📦 Sample Products ({products.length}):</h3>
          <ul>
            {products.map(product => (
              <li key={product.id} style={{ marginBottom: '10px' }}>
                <strong>{product.nama_produk}</strong> - Rp {product.harga?.toLocaleString()}
                <br />
                <small>Stok: {product.stok} | Kategori: {product.kategori_id}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>🔍 Check browser console for detailed connection logs</p>
      </div>
    </div>
  );
};

export default TestSupabase; // ✅ PASTIKAN ADA DEFAULT EXPORT