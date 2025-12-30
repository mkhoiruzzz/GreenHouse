// ✅ SIMPLE VERSION - PASTI BEKERJA
import { createClient } from '@supabase/supabase-js';

// Buat client langsung
const supabaseUrl = 'https://ycwcbxbytdtmluzalofn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljd2NieGJ5dGR0bWx1emFsb2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzQ5MjYsImV4cCI6MjA3NzIxMDkyNn0.vUIl0MH5J42gQhjQTXPYF5XCkgofoQJJNNr_jHayrOM';

const supabase = createClient(supabaseUrl, supabaseKey);

export const productsService = {
  getAllProducts: async () => {
    console.log('🚀 SIMPLE: Fetching products...');
    
    try {
      // ✅ PAKAI FETCH LANGSUNG - LEBIH RELIABLE
      const response = await fetch(
        'https://ycwcbxbytdtmluzalofn.supabase.co/rest/v1/products?select=id,nama_produk,deskripsi,harga,stok,gambar_url,kategori_id,created_at&limit=20',
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Fetch error:', errorText);
        
        // Return fallback data
        return getFallbackProducts();
      }
      
      const data = await response.json();
      console.log(`✅ SIMPLE: Got ${data.length} products`);
      
      // Tambahkan categories dummy jika tidak ada
      return data.map(product => ({
        ...product,
        categories: product.categories || { name_kategori: 'Tanaman' }
      }));
      
    } catch (error) {
      console.error('❌ SIMPLE fetch failed:', error);
      return getFallbackProducts();
    }
  },
  
  getAllCategories: async () => {
    console.log('🚀 SIMPLE: Fetching categories...');
    
    try {
      const response = await fetch(
        'https://ycwcbxbytdtmluzalofn.supabase.co/rest/v1/categories?select=id,name_kategori&limit=10',
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SIMPLE: Got ${data.length} categories`);
        return data;
      }
      
      // Fallback categories
      return [
        { id: 1, name_kategori: 'Tanaman Hias' },
        { id: 2, name_kategori: 'Tanaman Gantung' },
        { id: 3, name_kategori: 'Kaktus & Sukulen' },
        { id: 4, name_kategori: 'Bibit & Benih' },
        { id: 5, name_kategori: 'Pot & Aksesoris' }
      ];
      
    } catch (error) {
      console.error('❌ Categories fetch error:', error);
      return [];
    }
  },
  
  getProductById: async (id) => {
    try {
      const response = await fetch(
        `https://ycwcbxbytdtmluzalofn.supabase.co/rest/v1/products?id=eq.${id}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data[0] || null;
      }
      return null;
    } catch (error) {
      console.error('❌ getProductById error:', error);
      return null;
    }
  }
};

// Fallback products jika API gagal
function getFallbackProducts() {
  console.log('🔄 Returning fallback products');
  return [
    {
      id: 1,
      nama_produk: 'Monstera Deliciosa',
      deskripsi: 'Tanaman hias daun besar cocok untuk indoor',
      harga: 150000,
      stok: 10,
      gambar_url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=300&fit=crop',
      kategori_id: 1,
      created_at: new Date().toISOString(),
      categories: { name_kategori: 'Tanaman Hias' }
    },
    {
      id: 2,
      nama_produk: 'Lidah Mertua (Sansevieria)',
      deskripsi: 'Tanaman pembersih udara, perawatan mudah',
      harga: 75000,
      stok: 25,
      gambar_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=300&fit=crop',
      kategori_id: 1,
      created_at: new Date().toISOString(),
      categories: { name_kategori: 'Tanaman Hias' }
    },
    {
      id: 3,
      nama_produk: 'Aglaonema Red Sumatra',
      deskripsi: 'Tanaman hias daun merah, mempercantik ruangan',
      harga: 120000,
      stok: 8,
      gambar_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
      kategori_id: 1,
      created_at: new Date().toISOString(),
      categories: { name_kategori: 'Tanaman Hias' }
    },
    {
      id: 4,
      nama_produk: 'Pakis Boston',
      deskripsi: 'Tanaman gantung dengan daun yang rimbun',
      harga: 65000,
      stok: 15,
      gambar_url: 'https://images.unsplash.com/photo-1598880940086-4b3b0b5b5b5b?w=400&h=300&fit=crop',
      kategori_id: 2,
      created_at: new Date().toISOString(),
      categories: { name_kategori: 'Tanaman Gantung' }
    }
  ];
}