import React from 'react';
import { Link } from 'react-router-dom';


const About = () => {

  return (
    <div className="min-h-screen mt-16 py-8 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-emerald-600 mb-4">
            Tentang Kami
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Green House - Tempat terbaik untuk menemukan tanaman hias impian Anda
          </p>
        </div>

        {/* Visi Misi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-emerald-600 mb-4">
              Visi Kami
            </h2>
            <p className="text-gray-700">
              Menjadi platform terdepan dalam menyediakan tanaman hias berkualitas dengan layanan pengiriman yang aman dan terpercaya di seluruh Indonesia.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-emerald-600 mb-4">
              Misi Kami
            </h2>
            <ul className="text-gray-700 space-y-2">
              <li>• Menyediakan berbagai jenis tanaman hias berkualitas</li>
              <li>• Memberikan pengalaman belanja yang mudah dan aman</li>
              <li>• Menjamin keamanan pengiriman sesuai ketahanan tanaman</li>
              <li>• Memberikan edukasi perawatan tanaman kepada customer</li>
            </ul>
          </div>
        </div>

        {/* Cerita Kami */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12 border border-gray-100">
          <h2 className="text-3xl font-bold text-emerald-600 mb-6 text-center">
            Cerita Kami
          </h2>
          <div className="prose max-w-none text-gray-700">
            <p className="mb-4">
              Green House didirikan pada tahun 2020 dengan passion yang mendalam terhadap keindahan alam dan tanaman hias. Kami percaya bahwa tanaman tidak hanya mempercantik ruangan, tetapi juga membawa ketenangan dan kebahagiaan.
            </p>
            <p className="mb-4">
              Dengan pengalaman lebih dari 5 tahun di industri tanaman hias, kami memahami betul pentingnya penanganan yang tepat dalam pengiriman tanaman. Itulah mengapa kami mengembangkan sistem pengiriman berdasarkan ketahanan tanaman:
            </p>
            <ul className="mb-4 space-y-2">
              <li>
                • <strong className="text-gray-900">
                  Tanaman Sangat Rentan
                </strong> - Hanya dikirim di Surabaya
              </li>
              <li>
                • <strong className="text-gray-900">
                  Tanaman Rentan
                </strong> - Dikirim ke seluruh Jawa
              </li>
              <li>
                • <strong className="text-gray-900">
                  Tanaman Tahan Lama
                </strong> - Dikirim ke seluruh Indonesia
              </li>
            </ul>
            <p>
              Hingga saat ini, kami telah melayani ribuan customer yang puas dan terus berkembang menjadi toko tanaman hias terpercaya.
            </p>
          </div>
        </div>

        {/* Tim */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-emerald-600 mb-8 text-center">
            Tim Kami
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center bg-white rounded-lg shadow-md p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl shadow-lg">
                👨‍💼
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                MKhoiruzZ
              </h3>
              <p className="text-emerald-600 font-semibold mb-2">
                Founder & CEO
              </p>
              <p className="text-gray-600 text-sm">
                Pecinta tanaman dengan pengalaman 10 tahun di industri horticulture
              </p>
            </div>

            <div className="text-center bg-white rounded-lg shadow-md p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl shadow-lg">
                👩‍🌾
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Sari Indah
              </h3>
              <p className="text-emerald-600 font-semibold mb-2">
                Kepala Kebun
              </p>
              <p className="text-gray-600 text-sm">
                Ahli perawatan tanaman dengan sertifikasi internasional
              </p>
            </div>

            <div className="text-center bg-white rounded-lg shadow-md p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl shadow-lg">
                👨‍🔬
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Ahmad Rizki
              </h3>
              <p className="text-emerald-600 font-semibold mb-2">
                Spesialis Tanaman
              </p>
              <p className="text-gray-600 text-sm">
                Spesialis identifikasi dan klasifikasi ketahanan tanaman
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Siap Berbelanja?
          </h2>
          <p className="text-emerald-50 text-lg mb-8 max-w-2xl mx-auto">
            Jelajahi koleksi tanaman hias terbaik kami dan temukan tanaman impian Anda
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-emerald-600 bg-white rounded-xl hover:bg-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              Lihat Produk
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;