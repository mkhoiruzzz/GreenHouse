// src/services/productsService.js - ENHANCED DEBUG VERSION
import { supabase } from '../lib/supabase';

export const productsService = {
  // Get all products with category information
  getAllProducts: async () => {
    try {
      console.log('🔄 [getAllProducts] Starting fetch from Supabase...');
      console.log('🔄 [getAllProducts] Supabase client:', supabase ? '✅ Connected' : '❌ NOT Connected');
      
      const startTime = performance.now();
      
   // KODE BARU (line 23-44)
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
  .or("is_deleted.is.null,is_deleted.eq.false") // ✅ TAMBAH INI
  .order('created_at', { ascending: false });

      const endTime = performance.now();
      console.log(`⏱️ [getAllProducts] Query took ${(endTime - startTime).toFixed(2)}ms`);

      if (error) {
        console.error('❌ [getAllProducts] Supabase error:', error);
        console.error('❌ [getAllProducts] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ [getAllProducts] Raw data received');
      console.log('📊 [getAllProducts] Number of products:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.warn('⚠️ [getAllProducts] No products found in database');
        return [];
      }
      
      // Log first product as sample
      if (data.length > 0) {
        console.log('📦 [getAllProducts] First product sample:', {
          id: data[0].id,
          nama_produk: data[0].nama_produk,
          harga: data[0].harga,
          stok: data[0].stok,
          gambar_url: data[0].gambar_url,
          has_categories: !!data[0].categories
        });
      }
      
      // Normalize image field
      const normalizedData = (data || []).map((product, index) => {
        const normalized = {
          ...product,
          gambar_url: product.gambar_url || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia'
        };
        
        // Validate required fields
        if (!normalized.id) {
          console.error(`❌ [getAllProducts] Product at index ${index} missing ID:`, product);
        }
        if (!normalized.nama_produk) {
          console.warn(`⚠️ [getAllProducts] Product ${normalized.id} missing nama_produk`);
        }
        
        return normalized;
      });
      
      console.log('✅ [getAllProducts] Products normalized successfully:', normalizedData.length);
      return normalizedData;
    } catch (error) {
      console.error('❌ [getAllProducts] Catch error:', error);
      console.error('❌ [getAllProducts] Error stack:', error.stack);
      throw error;
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
      
      // Normalize image field
      const normalizedProduct = {
        ...data,
        gambar_url: data.gambar_url || 'https://placehold.co/600x400/4ade80/white?text=Gambar+Tidak+Tersedia'
      };
      
      console.log('✅ [getProductById] Product normalized successfully');
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