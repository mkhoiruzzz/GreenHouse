// src/services/productsService.js - ENHANCED DEBUG VERSION
import { supabase } from '../lib/supabase';

export const productsService = {
  // Get all products with category information
  getAllProducts: async () => {
    const fetchWithFallback = async () => {
      // 1. Try Supabase Client
      try {
        console.log('🔄 [getAllProducts] Attempting Supabase Client fetch...');

        // Create a promise that rejects after 10 seconds (increased from 3s)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase Client Timeout')), 10000)
        );

        const clientPromise = supabase
          .from('products')
          .select(`
            id,
            nama_produk,
            deskripsi,
            deskripsi_lengkap,
            harga,
            stok,
            gambar_url,
            kategori_id,
            max_pengiriman_hari,
            cara_perawatan,
            created_at,
            categories:categories(id, name_kategori)
          `)
          .or("is_deleted.is.null,is_deleted.eq.false")
          .order('created_at', { ascending: false });

        const { data, error } = await Promise.race([clientPromise, timeoutPromise]);

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('⚠️ [getAllProducts] Supabase Client failed/timed-out, switching to Raw Fetch:', err);

        // 2. Fallback to Raw Fetch
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // Manual join is hard with raw fetch without complex query params, 
        // so we'll fetch products and categories separately for the fallback
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/products?or=(is_deleted.is.null,is_deleted.eq.false)&select=*&order=created_at.desc`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          }),
          fetch(`${supabaseUrl}/rest/v1/categories?select=id,name_kategori`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          })
        ]);

        if (!productsResponse.ok) throw new Error(`Raw Fetch Products Failed: ${productsResponse.status}`);

        const products = await productsResponse.json();
        let categories = [];
        if (categoriesResponse.ok) {
          categories = await categoriesResponse.json();
        }

        // Manually map categories
        return products.map(p => ({
          ...p,
          categories: categories.find(c => c.id === p.kategori_id) || null
        }));
      }
    };

    try {
      const data = await fetchWithFallback();

      console.log('🔄 [getAllProducts] Processing data for reviews and sold counts...');

      // Bulk fetch reviews and paid order items for aggregation
      const [{ data: allReviews }, { data: allSold }] = await Promise.all([
        supabase.from('reviews').select('product_id, rating'),
        supabase.from('order_items')
          .select('product_id, quantity, orders!inner(status_pembayaran)')
          .eq('orders.status_pembayaran', 'paid')
      ]);

      // Create aggregation maps
      const ratingMap = {};
      const soldMap = {};

      allReviews?.forEach(rev => {
        if (!ratingMap[rev.product_id]) ratingMap[rev.product_id] = { sum: 0, count: 0 };
        ratingMap[rev.product_id].sum += rev.rating;
        ratingMap[rev.product_id].count++;
      });

      allSold?.forEach(item => {
        const pid = item.product_id;
        soldMap[pid] = (soldMap[pid] || 0) + (item.quantity || 0);
      });

      // Normalize and join data
      const normalizedData = (data || []).map((product) => {
        const ratingInfo = ratingMap[product.id] || { sum: 0, count: 0 };
        return {
          ...product,
          gambar_url: product.gambar_url || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia',
          avg_rating: ratingInfo.count > 0 ? ratingInfo.sum / ratingInfo.count : 0,
          total_reviews: ratingInfo.count,
          total_sold: soldMap[product.id] || 0
        };
      });

      console.log('✅ [getAllProducts] Data processed successfully');
      return normalizedData;
    } catch (error) {
      console.error('❌ [getAllProducts] All fetch methods failed:', error);
      // Return empty array instead of throwing to prevent UI crash
      return [];
    }
  },

  // Get all categories
  getAllCategories: async () => {
    try {
      console.log('🔄 [getAllCategories] Fetching categories from Supabase...');

      const { data, error } = await supabase
        .from('categories')
        .select('id, name_kategori')
        .order('name_kategori');

      if (error) {
        console.error('❌ [getAllCategories] Supabase error:', error);
        console.error('❌ [getAllCategories] Error details:', {
          message: error.message,
          code: error.code
        });
        throw error;
      }

      console.log('✅ [getAllCategories] Categories fetched:', data?.length || 0);

      if (data && data.length > 0) {
        console.log('📦 [getAllCategories] Sample category:', data[0]);
      }

      return data || [];
    } catch (error) {
      console.error('❌ [getAllCategories] Error fetching categories:', error);
      throw error;
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      console.log(`🔄 [getProductById] Fetching product with ID: ${id}`);
      console.log(`🔍 [getProductById] ID type: ${typeof id}`);

      if (!id) {
        console.error('❌ [getProductById] No ID provided');
        throw new Error('Product ID is required');
      }

      const startTime = performance.now();

      // KODE BARU (line 114-135)
      const { data, error } = await supabase
        .from('products')
        .select(`
    id,
    nama_produk,
    deskripsi,
    deskripsi_lengkap,
    harga,
    stok,
    gambar_url,
    kategori_id,
    max_pengiriman_hari,
    cara_perawatan,
    created_at,
    categories (
      id,
      name_kategori
    )
  `)
        .eq('id', id)
        .or("is_deleted.is.null,is_deleted.eq.false") // ✅ TAMBAH INI
        .single();

      const endTime = performance.now();
      console.log(`⏱️ [getProductById] Query took ${(endTime - startTime).toFixed(2)}ms`);

      if (error) {
        console.error('❌ [getProductById] Supabase error:', error);
        console.error('❌ [getProductById] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Check if it's a "not found" error
        if (error.code === 'PGRST116') {
          console.error('❌ [getProductById] Product not found in database');
          throw new Error(`Product with ID ${id} not found`);
        }

        throw error;
      }

      if (!data) {
        console.error('❌ [getProductById] No data returned from Supabase');
        throw new Error(`Product with ID ${id} not found`);
      }

      console.log('✅ [getProductById] Product data received');
      console.log('📦 [getProductById] Product details:', {
        id: data.id,
        nama_produk: data.nama_produk,
        harga: data.harga,
        stok: data.stok,
        gambar_url: data.gambar_url ? '✅ Has image' : '❌ No image',
        cara_perawatan: data.cara_perawatan ? `✅ ${data.cara_perawatan.length} chars` : '❌ No data',
        categories: data.categories ? '✅ Has category' : '❌ No category'
      });

      // Fetch reviews for rating
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', id);

      // Fetch sold count
      const { data: soldData } = await supabase
        .from('order_items')
        .select('quantity, orders!inner(status_pembayaran)')
        .eq('product_id', id)
        .eq('orders.status_pembayaran', 'paid');

      const avgRating = reviewsData?.length > 0
        ? reviewsData.reduce((acc, rev) => acc + rev.rating, 0) / reviewsData.length
        : 0;

      const totalSold = soldData?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;

      // Normalize product data
      const normalizedProduct = {
        ...data,
        gambar_url: data.gambar_url || 'https://placehold.co/600x400/4ade80/white?text=Gambar+Tidak+Tersedia',
        avg_rating: avgRating,
        total_reviews: reviewsData?.length || 0,
        total_sold: totalSold,
        reviews: reviewsData || []
      };

      console.log('✅ [getProductById] Product normalized successfully with reviews and sold count');
      return normalizedProduct;
    } catch (error) {
      console.error('❌ [getProductById] Error fetching product:', error);
      console.error('❌ [getProductById] Error stack:', error.stack);
      throw error;
    }
  },

  // Search products
  searchProducts: async (searchTerm) => {
    try {
      console.log(`🔍 [searchProducts] Searching for: "${searchTerm}"`);

      // KODE BARU (line 183-205)
      const { data, error } = await supabase
        .from('products')
        .select(`
    id,
    nama_produk,
    deskripsi,
    deskripsi_lengkap,
    harga,
    stok,
    gambar_url,
    kategori_id,
    durability,
    tingkat_kesulitan,
    max_pengiriman_hari,
    cara_perawatan,
    created_at,
    categories (
      id,
      name_kategori
    )
  `)
        .or(`nama_produk.ilike.%${searchTerm}%,deskripsi.ilike.%${searchTerm}%,deskripsi_lengkap.ilike.%${searchTerm}%`)
        .or("is_deleted.is.null,is_deleted.eq.false") // ✅ TAMBAH INI
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [searchProducts] Supabase error:', error);
        throw error;
      }

      console.log(`✅ [searchProducts] Found ${data?.length || 0} products`);

      // Normalize image field
      const normalizedData = (data || []).map(product => ({
        ...product,
        gambar_url: product.gambar_url || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia'
      }));

      return normalizedData;
    } catch (error) {
      console.error('❌ [searchProducts] Error searching products:', error);
      throw error;
    }
  },

  // Get products by category
  getProductsByCategory: async (categoryId) => {
    try {
      console.log(`🔍 [getProductsByCategory] Fetching category ID: ${categoryId}`);

      // KODE BARU (line 237-259)
      const { data, error } = await supabase
        .from('products')
        .select(`
    id,
    nama_produk,
    deskripsi,
    deskripsi_lengkap,
    harga,
    stok,
    gambar_url,
    kategori_id,
    durability,
    tingkat_kesulitan,
    max_pengiriman_hari,
    cara_perawatan,
    created_at,
    categories (
      id,
      name_kategori
    )
  `)
        .eq('kategori_id', categoryId)
        .or("is_deleted.is.null,is_deleted.eq.false") // ✅ TAMBAH INI
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [getProductsByCategory] Supabase error:', error);
        throw error;
      }

      console.log(`✅ [getProductsByCategory] Found ${data?.length || 0} products`);

      // Normalize image field
      const normalizedData = (data || []).map(product => ({
        ...product,
        gambar_url: product.gambar_url || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia'
      }));

      return normalizedData;
    } catch (error) {
      console.error('❌ [getProductsByCategory] Error fetching products by category:', error);
      throw error;
    }
  },

  // Get featured products
  getFeaturedProducts: async () => {
    try {
      console.log('🔄 [getFeaturedProducts] Fetching featured products...');

      // KODE BARU (line 291-313)
      const { data, error } = await supabase
        .from('products')
        .select(`
    id,
    nama_produk,
    deskripsi,
    deskripsi_lengkap,
    harga,
    stok,
    gambar_url,
    kategori_id,
    durability,
    tingkat_kesulitan,
    max_pengiriman_hari,
    cara_perawatan,
    created_at,
    categories (
      id,
      name_kategori
    )
  `)
        .or("is_deleted.is.null,is_deleted.eq.false") // ✅ TAMBAH INI
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        console.error('❌ [getFeaturedProducts] Supabase error:', error);
        throw error;
      }

      console.log(`✅ [getFeaturedProducts] Found ${data?.length || 0} featured products`);

      // Normalize image field
      const normalizedData = (data || []).map(product => ({
        ...product,
        gambar_url: product.gambar_url || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia'
      }));

      return normalizedData;
    } catch (error) {
      console.error('❌ [getFeaturedProducts] Error fetching featured products:', error);
      throw error;
    }
  },

  // Test Supabase connection
  testConnection: async () => {
    try {
      console.log('🔄 [testConnection] Testing Supabase connection...');

      const { data, error } = await supabase
        .from('products')
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ [testConnection] Connection test failed:', error);
        return { success: false, error };
      }

      console.log('✅ [testConnection] Connection successful');
      return { success: true, data };
    } catch (error) {
      console.error('❌ [testConnection] Connection test error:', error);
      return { success: false, error };
    }
  }
};