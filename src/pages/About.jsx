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
              Hingga saat ini, kami telah melayani ribuan customer yang puas dan terus berkembang menjadi Green House hias terpercaya.
            </p>
          </div>
        </div>
      </div>
    </div>

  );
};

export default About;