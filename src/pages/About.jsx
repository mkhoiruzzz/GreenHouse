import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen mt-16 py-8 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">Tentang Kami</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Green House - Tempat terbaik untuk menemukan tanaman hias impian Anda
          </p>
        </div>

        {/* Visi Misi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-primary mb-4">Visi Kami</h2>
            <p className="text-gray-700">
              Menjadi platform terdepan dalam menyediakan tanaman hias berkualitas 
              dengan layanan pengiriman yang aman dan terpercaya di seluruh Indonesia.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-primary mb-4">Misi Kami</h2>
            <ul className="text-gray-700 space-y-2">
              <li>• Menyediakan berbagai jenis tanaman hias berkualitas</li>
              <li>• Memberikan pengalaman belanja yang mudah dan aman</li>
              <li>• Menjamin keamanan pengiriman sesuai ketahanan tanaman</li>
              <li>• Memberikan edukasi perawatan tanaman kepada customer</li>
            </ul>
          </div>
        </div>

        {/* Cerita Kami */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-3xl font-bold text-primary mb-6 text-center">Cerita Kami</h2>
          <div className="prose max-w-none text-gray-700">
            <p className="mb-4">
              Green House didirikan pada tahun 2020 dengan passion yang mendalam terhadap 
              keindahan alam dan tanaman hias. Kami percaya bahwa tanaman tidak hanya 
              mempercantik ruangan, tetapi juga membawa ketenangan dan kebahagiaan.
            </p>
            <p className="mb-4">
              Dengan pengalaman lebih dari 5 tahun di industri tanaman hias, kami memahami 
              betul pentingnya penanganan yang tepat dalam pengiriman tanaman. Itulah 
              mengapa kami mengembangkan sistem pengiriman berdasarkan ketahanan tanaman:
            </p>
            <ul className="mb-4 space-y-2">
              <li>• <strong>Tanaman Sangat Rentan</strong> - Hanya dikirim di Surabaya</li>
              <li>• <strong>Tanaman Rentan</strong> - Dikirim ke seluruh Jawa</li>
              <li>• <strong>Tanaman Tahan Lama</strong> - Dikirim ke seluruh Indonesia</li>
            </ul>
            <p>
              Hingga saat ini, kami telah melayani ribuan customer yang puas dan 
              terus berkembang menjadi toko tanaman hias terpercaya.
            </p>
          </div>
        </div>

        {/* Tim */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8 text-center">Tim Kami</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center bg-white rounded-lg shadow-md p-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl">
                👨‍💼
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">MKhoiruzZ</h3>
              <p className="text-secondary font-semibold mb-2">Founder & CEO</p>
              <p className="text-gray-600 text-sm">
                Pecinta tanaman dengan pengalaman 10 tahun di industri horticulture
              </p>
            </div>
            
            <div className="text-center bg-white rounded-lg shadow-md p-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl">
                👩‍🌾
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Sari Indah</h3>
              <p className="text-secondary font-semibold mb-2">Head Gardener</p>
              <p className="text-gray-600 text-sm">
                Ahli perawatan tanaman dengan sertifikasi internasional
              </p>
            </div>
            
            <div className="text-center bg-white rounded-lg shadow-md p-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl">
                👨‍🔬
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Ahmad Rizki</h3>
              <p className="text-secondary font-semibold mb-2">Plant Specialist</p>
              <p className="text-gray-600 text-sm">
                Spesialis identifikasi dan klasifikasi ketahanan tanaman
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;