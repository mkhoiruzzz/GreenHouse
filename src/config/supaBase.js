// src/config/supabase.js
import { createClient } from '@supabase/supabase-js'

// Debug environment variables
console.log('🔧 Supabase Config Loading...');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback untuk development jika env variables belum ada
const finalSupabaseUrl = supabaseUrl || 'https://ycwcbxbytdtmluzalofn.supabase.co'
const finalSupabaseKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljd2NieGJ5dGR0bWx1emFsb2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzQ5MjYsImV4cCI6MjA3NzIxMDkyNn0.vUIl0MH5J42gQhjQTXPYF5XCkgofoQJJNNr_jHayrOM';

export const supabase = createClient(finalSupabaseUrl, finalSupabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

console.log('✅ Supabase client initialized');