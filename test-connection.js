
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables missing!');
    process.exit(1);
}

console.log('🔗 Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('⏳ Sending request...');
    const start = Date.now();
    try {
        const { data, error } = await supabase.from('products').select('id').limit(1);
        const end = Date.now();

        if (error) {
            console.error('❌ Supabase error:', error);
        } else {
            console.log('✅ Success! Data:', data);
            console.log(`⏱️ Duration: ${end - start}ms`);
        }
    } catch (err) {
        console.error('❌ Node exception:', err);
    }
}

run();
