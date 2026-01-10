// DIAGNOSTIC TEST - Hapus file ini setelah masalah resolved
import { supabase } from './lib/supabase';

console.log('🔧 Starting Supabase Connection Test...');
console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

async function testConnection() {
    try {
        console.log('\n1️⃣ Testing basic connection...');
        const { data: connectionTest, error: connError } = await supabase
            .from('products')
            .select('id')
            .limit(1);

        if (connError) {
            console.error('❌ Connection failed:', connError);
            return;
        }
        console.log('✅ Connection OK');

        console.log('\n2️⃣ Testing simple SELECT...');
        const start1 = performance.now();
        const { data: simpleData, error: simpleError } = await supabase
            .from('products')
            .select('id, nama_produk')
            .limit(5);
        const end1 = performance.now();

        if (simpleError) {
            console.error('❌ Simple query failed:', simpleError);
        } else {
            console.log(`✅ Simple query OK (${(end1 - start1).toFixed(2)}ms)`);
            console.log('   Rows:', simpleData?.length);
        }

        console.log('\n3️⃣ Testing query WITH join...');
        const start2 = performance.now();
        const { data: joinData, error: joinError } = await supabase
            .from('products')
            .select('id, nama_produk, categories(name_kategori)')
            .limit(5);
        const end2 = performance.now();

        if (joinError) {
            console.error('❌ Join query failed:', joinError);
        } else {
            console.log(`✅ Join query OK (${(end2 - start2).toFixed(2)}ms)`);
            console.log('   Rows:', joinData?.length);
        }

        console.log('\n4️⃣ Testing query WITH is_deleted filter...');
        const start3 = performance.now();
        const { data: filterData, error: filterError } = await supabase
            .from('products')
            .select('id, nama_produk')
            .or('is_deleted.is.null,is_deleted.eq.false')
            .limit(5);
        const end3 = performance.now();

        if (filterError) {
            console.error('❌ Filter query failed:', filterError);
        } else {
            console.log(`✅ Filter query OK (${(end3 - start3).toFixed(2)}ms)`);
            console.log('   Rows:', filterData?.length);
        }

        console.log('\n5️⃣ Testing FULL query (as in app)...');
        const start4 = performance.now();
        const { data: fullData, error: fullError } = await supabase
            .from('products')
            .select('*, categories(id, name_kategori)')
            .or('is_deleted.is.null,is_deleted.eq.false')
            .order('created_at', { ascending: false })
            .limit(50);
        const end4 = performance.now();

        if (fullError) {
            console.error('❌ Full query failed:', fullError);
        } else {
            console.log(`✅ Full query OK (${(end4 - start4).toFixed(2)}ms)`);
            console.log('   Rows:', fullData?.length);
        }

        console.log('\n✅ ALL TESTS COMPLETED!');

    } catch (error) {
        console.error('❌ Test failed with exception:', error);
    }
}

testConnection();
