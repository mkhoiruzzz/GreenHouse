import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const About = () => {
  const { t } = useTheme();

  return (
    <div className="min-h-screen mt-16 py-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 transition-colors duration-300">
            {t('Tentang Kami', 'About Us')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors duration-300">
            {t(
              'Green House - Tempat terbaik untuk menemukan tanaman hias impian Anda',
              'Green House - The best place to find your dream ornamental plants'
            )}
          </p>
        </div>

        {/* Visi Misi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 transition-colors duration-300">
              {t('Visi Kami', 'Our Vision')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 transition-colors duration-300">
              {t(
                'Menjadi platform terdepan dalam menyediakan tanaman hias berkualitas dengan layanan pengiriman yang aman dan terpercaya di seluruh Indonesia.',
                'To become the leading platform in providing quality ornamental plants with safe and reliable delivery services throughout Indonesia.'
              )}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-lg">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 transition-colors duration-300">
              {t('Misi Kami', 'Our Mission')}
            </h2>
            <ul className="text-gray-700 dark:text-gray-300 space-y-2 transition-colors duration-300">
              <li>• {t('Menyediakan berbagai jenis tanaman hias berkualitas', 'Provide various types of quality ornamental plants')}</li>
              <li>• {t('Memberikan pengalaman belanja yang mudah dan aman', 'Provide an easy and safe shopping experience')}</li>
              <li>• {t('Menjamin keamanan pengiriman sesuai ketahanan tanaman', 'Ensure safe delivery according to plant durability')}</li>
              <li>• {t('Memberikan edukasi perawatan tanaman kepada customer', 'Provide plant care education to customers')}</li>
            </ul>
          </div>
        </div>

        {/* Cerita Kami */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-8 mb-12 border border-gray-100 dark:border-gray-700 transition-all duration-300">
          <h2 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-6 text-center transition-colors duration-300">
            {t('Cerita Kami', 'Our Story')}
          </h2>
          <div className="prose max-w-none text-gray-700 dark:text-gray-300 transition-colors duration-300">
            <p className="mb-4">
              {t(
                'Green House didirikan pada tahun 2020 dengan passion yang mendalam terhadap keindahan alam dan tanaman hias. Kami percaya bahwa tanaman tidak hanya mempercantik ruangan, tetapi juga membawa ketenangan dan kebahagiaan.',
                'Green House was founded in 2020 with a deep passion for the beauty of nature and ornamental plants. We believe that plants not only beautify rooms, but also bring peace and happiness.'
              )}
            </p>
            <p className="mb-4">
              {t(
                'Dengan pengalaman lebih dari 5 tahun di industri tanaman hias, kami memahami betul pentingnya penanganan yang tepat dalam pengiriman tanaman. Itulah mengapa kami mengembangkan sistem pengiriman berdasarkan ketahanan tanaman:',
                'With more than 5 years of experience in the ornamental plant industry, we understand the importance of proper handling in plant delivery. That is why we developed a delivery system based on plant durability:'
              )}
            </p>
            <ul className="mb-4 space-y-2">
              <li>
                • <strong className="text-gray-900 dark:text-white">
                  {t('Tanaman Sangat Rentan', 'Very Fragile Plants')}
                </strong> - {t('Hanya dikirim di Surabaya', 'Only delivered in Surabaya')}
              </li>
              <li>
                • <strong className="text-gray-900 dark:text-white">
                  {t('Tanaman Rentan', 'Fragile Plants')}
                </strong> - {t('Dikirim ke seluruh Jawa', 'Delivered throughout Java')}
              </li>
              <li>
                • <strong className="text-gray-900 dark:text-white">
                  {t('Tanaman Tahan Lama', 'Durable Plants')}
                </strong> - {t('Dikirim ke seluruh Indonesia', 'Delivered throughout Indonesia')}
              </li>
            </ul>
            <p>
              {t(
                'Hingga saat ini, kami telah melayani ribuan customer yang puas dan terus berkembang menjadi toko tanaman hias terpercaya.',
                'To date, we have served thousands of satisfied customers and continue to grow as a trusted ornamental plant store.'
              )}
            </p>
          </div>
        </div>

        {/* Tim */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-8 text-center transition-colors duration-300">
            {t('Tim Kami', 'Our Team')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 dark:from-emerald-600 dark:to-teal-800 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl shadow-lg">
                👨‍💼
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                MKhoiruzZ
              </h3>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold mb-2 transition-colors duration-300">
                Founder & CEO
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
                {t(
                  'Pecinta tanaman dengan pengalaman 10 tahun di industri horticulture',
                  'Plant lover with 10 years of experience in the horticulture industry'
                )}
              </p>
            </div>
            
            <div className="text-center bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 dark:from-emerald-600 dark:to-teal-800 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl shadow-lg">
                👩‍🌾
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                Sari Indah
              </h3>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold mb-2 transition-colors duration-300">
                {t('Kepala Kebun', 'Head Gardener')}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
                {t(
                  'Ahli perawatan tanaman dengan sertifikasi internasional',
                  'Plant care expert with international certification'
                )}
              </p>
            </div>
            
            <div className="text-center bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 dark:from-emerald-600 dark:to-teal-800 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl shadow-lg">
                👨‍🔬
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                Ahmad Rizki
              </h3>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold mb-2 transition-colors duration-300">
                {t('Spesialis Tanaman', 'Plant Specialist')}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
                {t(
                  'Spesialis identifikasi dan klasifikasi ketahanan tanaman',
                  'Specialist in plant identification and durability classification'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800 rounded-2xl shadow-xl p-8 md:p-12 text-center transition-all duration-300">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('Siap Berbelanja?', 'Ready to Shop?')}
          </h2>
          <p className="text-emerald-50 text-lg mb-8 max-w-2xl mx-auto">
            {t(
              'Jelajahi koleksi tanaman hias terbaik kami dan temukan tanaman impian Anda',
              'Explore our best collection of ornamental plants and find your dream plant'
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-emerald-600 bg-white rounded-xl hover:bg-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              {t('Lihat Produk', 'View Products')}
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              {t('Hubungi Kami', 'Contact Us')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;