import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

// ✅ Regular client untuk user biasa (dengan RLS)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// ✅ Admin client dengan SERVICE ROLE KEY (bypass RLS)
// HANYA gunakan untuk operasi admin! JANGAN expose ke client/user biasa
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ✅ Helper function untuk invoke Edge Function dengan Authorization
export const invokeFunction = async (functionName, body) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Function invocation failed');
  }

  return result;
}