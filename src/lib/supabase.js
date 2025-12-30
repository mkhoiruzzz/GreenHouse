import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ycwcbxbytdtmluzalofn.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljd2NieGJ5dGR0bWx1emFsb2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzQ5MjYsImV4cCI6MjA0NjU0MTk5NX0.vUIl0MH5J42gQhjQTXPYF5XCkgofoQJJNNr_jHayrOM'

console.log('✅ Supabase client initialized')

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// ✅ HAPUS invokeFunction dari eksport
// Hanya eksport supabase saja