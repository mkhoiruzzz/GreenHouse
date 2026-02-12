import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiLinkedin, FiGithub, FiTwitter } from 'react-icons/fi'; // Using react-icons if available, otherwise will fallback to SVG
// If react-icons not available, I will use SVG directly in the code below.
// Let's use SVGs directly to be safe and avoid dependency issues if react-icons is not installed or different version.

const Footer = () => {
  return (
    <footer className="bg-green-900 text-green-50 z-10 relative mt-0 pt-16 pb-8">
      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2 group">
              <span className="text-3xl group-hover:rotate-12 transition-transform duration-300">🌱</span>
              <span className="text-2xl font-bold text-white tracking-tight">Green House</span>
            </Link>
            <p className="text-green-200 text-sm leading-relaxed">
              Green House adalah destinasi utama untuk tanaman hias premium.
              Kami berkomitmen menghadirkan keasrian alam ke dalam hunian Anda dengan
              kualitas terbaik dan pelayanan terpercaya.
            </p>
            <div className="flex space-x-4">
              {['whatsapp', 'instagram', 'facebook', 'x',].map((social) => (
                <a
                  key={social}
                  href={social === 'whatsapp' ? 'https://wa.me/6285174421826' : `https://${social}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center text-green-300 hover:bg-green-700 hover:text-white transition-all duration-300 transform hover:-translate-y-1"
                  aria-label={social}
                >
                  <img
                    src={`https://cdn.simpleicons.org/${social}/white`}
                    className="w-5 h-5 opacity-80 hover:opacity-100"
                    alt={social}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center">
              <span className="w-8 h-1 bg-green-500 rounded-full mr-3"></span>
              Perusahaan
            </h3>
            <ul className="space-y-4">
              {[
                { to: '/about', label: 'Tentang Kami' },
                { to: '/products', label: 'Produk Kami' },
                { to: '/contact', label: 'Hubungi Kami' },
                { to: '/blog', label: 'Blog & Artikel' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.to}
                    className="text-green-200 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center">
              <span className="w-8 h-1 bg-green-500 rounded-full mr-3"></span>
              Bantuan
            </h3>
            <ul className="space-y-4">
              {[
                { to: '/faq', label: 'FAQ' },
                { to: '/shipping', label: 'Pengiriman' },
                { to: '/returns', label: 'Kebijakan Pengembalian' },
                { to: '/privacy', label: 'Kebijakan Privasi' },

              ].map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.to}
                    className="text-green-200 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center">
              <span className="w-8 h-1 bg-green-500 rounded-full mr-3"></span>
              Newsletter
            </h3>
            <p className="text-green-200 text-sm mb-4">
              Dapatkan promo spesial dan tips perawatan tanaman setiap minggu.
            </p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email Anda..."
                className="w-full px-4 py-3 rounded-lg bg-green-800 border border-green-700 text-white placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              <button className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-900/50">
                Berlangganan
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar: Payment & Copyright */}
        <div className="border-t border-green-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-green-300 text-sm text-center md:text-left">
            © 2025 <span className="text-white font-semibold">Green House</span>. All rights reserved.
          </p>


        </div>
      </div>
    </footer>
  );
};

export default Footer;