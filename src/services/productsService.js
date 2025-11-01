// src/services/productsService.js - UNTUK SUPABASE
import { supabase } from '../lib/supabase';

export const productsService = {
  // Get all products with category information
  getAllProducts: async () => {
    try {
      console.log('🔄 Fetching products from Supabase...');
      
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      // Normalize image field
      const normalizedData = (data || []).map(product => ({
        ...product,
        gambar_url: product.gambar_url || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia'
      }));
      
      console.log('✅ Products fetched successfully:', normalizedData.length);
      return normalizedData;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      throw error;
    }
  },

  // Get all categories
  getAllCategories: async () => {
    try {
      console.log('🔄 Fetching categories from Supabase...');
      
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_kategori')
        .order('name_kategori');

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Categories fetched successfully:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      throw error;
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      console.log(`🔄 Fetching product with ID: ${id}`);
      
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
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      // Normalize image field
      const normalizedProduct = {
        ...data,
        gambar_url: data.gambar_url || 'https://placehold.co/600x400/4ade80/white?text=Gambar+Tidak+Tersedia'
      };
      
      console.log('✅ Product fetched successfully:', normalizedProduct);
      return normalizedProduct;
    } catch (error) {
      console.error('❌ Error fetching product:', error);
      throw error;
    }
  },

  // Search products
  searchProducts: async (searchTerm) => {
    try {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Normalize image field
      const normalizedData = (data || []).map(product => ({
        ...product,
        gambar_url: product.gambar_url || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia'
      }));
      
      return normalizedData;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // Get products by category
  getProductsByCategory: async (categoryId) => {
    try {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Normalize image field
      const normalizedData = (data || []).map(product => ({
        ...product,
        gambar_url: product.gambar_url || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia'
      }));
      
      return normalizedData;
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  },

  // Get featured products
  getFeaturedProducts: async () => {
    try {
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
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      
      // Normalize image field
      const normalizedData = (data || []).map(product => ({
        ...product,
        gambar_url: product.gambar_url || 'https://placehold.co/400x300/4ade80/white?text=Gambar+Tidak+Tersedia'
      }));
      
      return normalizedData;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  }
};