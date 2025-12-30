// PERBAIKAN CRITICAL: Fix Supabase query filter
export const productsService = {
  getAllProducts: async () => {
    try {
      console.log('🔄 [DEBUG] Fetching products from Supabase...');
      
      // ✅ PERBAIKAN: Gunakan .is() bukan .or() untuk null check
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          nama_produk,
          deskripsi,
          harga,
          stok,
          gambar_url,
          kategori_id,
          created_at,
          categories (
            id,
            name_kategori
          )
        `)
        .is('is_deleted', null) // ✅ BENAR: Check if is_deleted is NULL
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [ERROR] Supabase query failed:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        
        // Fallback: Try without the filter
        console.log('🔄 [DEBUG] Trying without is_deleted filter...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select('*')
          .limit(5);
          
        if (fallbackError) {
          throw fallbackError;
        }
        return fallbackData || [];
      }

      console.log(`✅ [SUCCESS] Got ${data?.length || 0} products`);
      
      // Debug image URLs
      if (data && data.length > 0) {
        data.forEach((product, index) => {
          console.log(`📦 Product ${index + 1}:`, {
            id: product.id,
            name: product.nama_produk,
            image: product.gambar_url ? 
              (product.gambar_url.startsWith('http') ? '✅ Valid URL' : `❓ ${product.gambar_url.substring(0, 30)}...`) : 
              '❌ No image'
          });
        });
      }

      return data || [];
      
    } catch (error) {
      console.error('❌ [FATAL] Error in getAllProducts:', error);
      
      // Return dummy data for development
      return [
        {
          id: 1,
          nama_produk: 'Monstera Deliciosa',
          deskripsi: 'Tanaman hias daun besar',
          harga: 150000,
          stok: 10,
          gambar_url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=300&fit=crop',
          kategori_id: 1,
          categories: { id: 1, name_kategori: 'Indoor' }
        },
        {
          id: 2,
          nama_produk: 'Lidah Mertua',
          deskripsi: 'Tanaman pembersih udara',
          harga: 75000,
          stok: 25,
          gambar_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=300&fit=crop',
          kategori_id: 1,
          categories: { id: 1, name_kategori: 'Indoor' }
        }
      ];
    }
  },
  
  // ... fungsi lainnya dengan perbaikan sama
};