import { createClient } from '@supabase/supabase-js'

// ✅ SINGLETON PATTERN: Pastikan hanya ada 1 instance
let supabaseInstance = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    console.log('🔄 Creating SINGLE Supabase client instance...');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ycwcbxbytdtmluzalofn.supabase.co';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljd2NieGJ5dGR0bWx1emFsb2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzQ5MjYsImV4cCI6MjA3NzIxMDkyNn0.vUIl0MH5J42gQhjQTXPYF5XCkgofoQJJNNr_jHayrOM';
    
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        // ✅ UNIQUE STORAGE KEY untuk menghindari konflik
        storageKey: 'greenhouse-supabase-auth'
      },
      // ✅ Global options
      global: {
        headers: {
          'x-application-name': 'greenhouse-app'
        }
      }
    });
    
    console.log('✅ Supabase client created (singleton)');
  }
  
  return supabaseInstance;
};

// ✅ Export singleton instance
export const supabase = getSupabaseClient();