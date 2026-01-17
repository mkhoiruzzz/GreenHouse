import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-primary text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="text-center sm:text-left">
            <h3 className="text-secondary text-lg md:text-xl font-bold mb-3 md:mb-4">Toko Tanaman</h3>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Toko tanaman hias terlengkap dan terpercaya sejak 2025. Menyediakan berbagai jenis tanaman berkualitas tinggi.
            </p>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="text-secondary text-lg md:text-xl font-bold mb-3 md:mb-4">Menu</h3>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Beranda' },
                { to: '/products', label: 'Produk' },
                { to: '/about', label: 'Tentang Kami' },
                { to: '/contact', label: 'Kontak' },
              ].map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.to}
                    className="text-gray-300 hover:text-secondary transition-colors duration-200 text-sm md:text-base block py-1"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="text-secondary text-lg md:text-xl font-bold mb-3 md:mb-4">Kontak</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center justify-center sm:justify-start gap-2 text-sm md:text-base">
                <span>📍</span>
                <span>Jl. Raya Hijau No. 123, Surabaya</span>
              </li>
              <li className="flex items-center justify-center sm:justify-start gap-2 text-sm md:text-base">
                <span>📞</span>
                <span>(+62) 851-7442-1826</span>
              </li>
              <li className="flex items-center justify-center sm:justify-start gap-2 text-sm md:text-base">
                <span>📧</span>
                <span>Khoiruz@greenhouse.com</span>
              </li>
              <li className="flex items-center justify-center sm:justify-start gap-2 text-sm md:text-base">
                <span>⏰</span>
                <span>Senin – Sabtu: 08.00 – 17.00</span>
              </li>
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="text-secondary text-lg md:text-xl font-bold mb-3 md:mb-4">Ikuti Kami</h3>
            <div className="flex justify-center sm:justify-start space-x-4">
              {/* Facebook */}
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-all duration-300 transform hover:scale-110" aria-label="Facebook">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1 .9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.6l-.4 3h-2.2v7A10 10 0 0022 12z" /></svg>
              </a>

              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-all duration-300 transform hover:scale-110" aria-label="Instagram">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.8-.9a1.1 1.1 0 11-2.2 0 1.1 1.1 0 012.2 0z" /></svg>
              </a>

              {/* LinkedIn */}
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-all duration-300 transform hover:scale-110" aria-label="LinkedIn">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4.98 3.5a2.5 2.5 0 11-.01 5.01 2.5 2.5 0 01.01-5.01zM3 9h4v12H3zm7 0h4v1.7c.6-1 2-2 4.1-2 4.4 0 5.9 2.9 5.9 6.7V21h-4v-5.1c0-1.7-.03-3.9-2.4-3.9-2.4 0-2.8 1.8-2.8 3.8V21h-4z" /></svg>
              </a>

              {/* GitHub */}
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-all duration-300 transform hover:scale-110" aria-label="GitHub">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.4 0 12.07c0 5.33 3.44 9.86 8.2 11.46.6.1.82-.26.82-.58v-2c-3.34.73-4.03-1.42-4.03-1.42-.55-1.4-1.33-1.77-1.33-1.77-1.1-.76.08-.74.08-.74 1.2.08 1.84 1.25 1.84 1.25 1.07 1.85 2.8 1.32 3.48 1 .1-.78.42-1.32.76-1.62-2.66-.3-5.47-1.35-5.47-5.98 0-1.32.47-2.4 1.24-3.23-.13-.3-.54-1.53.1-3.18 0 0 1-.33 3.3 1.24a11.3 11.3 0 013-.4c1.02 0 2.05.14 3.01.4 2.3-1.57 3.29-1.24 3.29-1.24.65 1.65.24 2.88.12 3.18.77.83 1.24 1.91 1.24 3.23 0 4.64-2.8 5.67-5.48 5.97.43.37.82 1.1.82 2.23v3.3c0 .32.21.7.82.58C20.56 21.92 24 17.39 24 12.07 24 5.4 18.63 0 12 0z" /></svg>
              </a>

              {/* TikTok */}
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-all duration-300 transform hover:scale-110" aria-label="TikTok">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-6 md:mt-8 pt-6 md:pt-8 text-center">
          <p className="text-gray-400 text-sm md:text-base">
            © 2025 Toko Tanaman. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;