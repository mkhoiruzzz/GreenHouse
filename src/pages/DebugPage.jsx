// src/pages/DebugPage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DebugPage = () => {
  const [results, setResults] = useState({
    supabaseConnected: null,
    envVariables: null,
    productsData: null,
    imageTest: null,
    error: null
  });

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const testResults = {};

    // Test 1: Check environment variables
    testResults.envVariables = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '❌ NOT FOUND',
      hasAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ EXISTS' : '❌ NOT FOUND'
    };

    // Test 2: Check Supabase connection
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, nama_produk, gambar_url')
        .limit(3);

      if (error) {
        testResults.supabaseConnected = `❌ ERROR: ${error.message}`;
        testResults.error = error;
      } else {
        testResults.supabaseConnected = `✅ CONNECTED - Found ${data?.length || 0} products`;
        testResults.productsData = data;
      }
    } catch (err) {
      testResults.supabaseConnected = `❌ EXCEPTION: ${err.message}`;
      testResults.error = err;
    }

    // Test 3: Test image URL
    if (testResults.productsData && testResults.productsData.length > 0) {
      const firstImage = testResults.productsData[0].gambar_url;
      testResults.imageTest = {
        url: firstImage,
        exists: firstImage ? '✅ URL EXISTS' : '❌ NO URL'
      };
    }

    setResults(testResults);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 mt-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          🔍 Debug Information
        </h1>

        {/* Environment Variables */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            1️⃣ Environment Variables
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-start">
              <span className="text-gray-600 dark:text-gray-400 w-32">Supabase URL:</span>
              <span className="text-gray-900 dark:text-white break-all">
                {results.envVariables?.supabaseUrl}
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-600 dark:text-gray-400 w-32">Anon Key:</span>
              <span className="text-gray-900 dark:text-white">
                {results.envVariables?.hasAnonKey}
              </span>
            </div>
          </div>
        </div>

        {/* Supabase Connection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            2️⃣ Supabase Connection
          </h2>
          <div className="font-mono text-sm">
            <div className="text-gray-900 dark:text-white mb-4">
              Status: {results.supabaseConnected || '⏳ Testing...'}
            </div>

            {results.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4">
                <div className="text-red-600 dark:text-red-400 font-semibold mb-2">Error Details:</div>
                <pre className="text-xs text-red-800 dark:text-red-300 overflow-auto">
                  {JSON.stringify(results.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Products Data */}
        {results.productsData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              3️⃣ Products Data (First 3)
            </h2>
            <div className="space-y-4">
              {results.productsData.map((product, index) => (
                <div key={product.id} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                  <div className="font-mono text-sm space-y-2">
                    <div className="flex items-start">
                      <span className="text-gray-600 dark:text-gray-400 w-24">ID:</span>
                      <span className="text-gray-900 dark:text-white">{product.id}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-gray-600 dark:text-gray-400 w-24">Name:</span>
                      <span className="text-gray-900 dark:text-white">{product.nama_produk}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-gray-600 dark:text-gray-400 w-24">Image URL:</span>
                      <span className="text-gray-900 dark:text-white break-all text-xs">
                        {product.gambar_url || '❌ NO URL'}
                      </span>
                    </div>

                    {/* Image Test */}
                    {product.gambar_url && (
                      <div className="mt-4">
                        <div className="text-gray-600 dark:text-gray-400 mb-2">Image Preview:</div>
                        <img
                          src={product.gambar_url}
                          alt={product.nama_produk}
                          className="w-48 h-48 object-cover rounded border-2 border-gray-300 dark:border-gray-600"
                          onLoad={() => console.log('✅ Image loaded:', product.nama_produk)}
                          onError={() => console.log('❌ Image failed:', product.nama_produk)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image URL Test */}
        {results.imageTest && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              4️⃣ Image URL Test
            </h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-start">
                <span className="text-gray-600 dark:text-gray-400 w-32">Status:</span>
                <span className="text-gray-900 dark:text-white">{results.imageTest.exists}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-600 dark:text-gray-400 w-32">URL:</span>
                <a
                  href={results.imageTest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all text-xs"
                >
                  {results.imageTest.url}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 text-center">
          <button
            onClick={runTests}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            🔄 Run Tests Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;