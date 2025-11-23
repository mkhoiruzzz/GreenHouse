import React, { useState } from 'react';
import { toast } from 'react-toastify';
import emailjs from '@emailjs/browser';
import { useTheme } from '../context/ThemeContext';

const Contact = () => {
  const { t } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  // EmailJS Configuration
  const EMAILJS_SERVICE_ID = 'service_t9g74el';
  const EMAILJS_TEMPLATE_ID = 'template_kg7z8zs';
  const EMAILJS_PUBLIC_KEY = 'tAM6BbqC9NJgJnfc_';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          to_email: 'mkhoiruzz21@gmail.com',
          reply_to: formData.email
        },
        EMAILJS_PUBLIC_KEY
      );

      if (result.text === 'OK') {
        toast.success(t(
          'Pesan berhasil dikirim! Kami akan membalas dalam 1x24 jam.',
          'Message sent successfully! We will reply within 24 hours.'
        ));
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(t(
        'Gagal mengirim pesan. Silakan coba lagi.',
        'Failed to send message. Please try again.'
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mt-16 py-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 transition-colors duration-300">
            {t('Hubungi Kami', 'Contact Us')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors duration-300">
            {t(
              'Butuh bantuan dalam memilih tanaman? Ada pertanyaan? Tim kami siap membantu Anda!',
              'Need help choosing plants? Have questions? Our team is ready to help you!'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informasi Kontak */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300">
              <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-6 transition-colors duration-300">
                {t('Informasi Kontak', 'Contact Information')}
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-colors duration-300">
                    📍
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white transition-colors duration-300">
                      {t('Alamat', 'Address')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      Jl. Raya Hijau No. 123<br />Surabaya, Jawa Timur 60272
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-colors duration-300">
                    📞
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white transition-colors duration-300">
                      {t('Telepon', 'Phone')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      (+62) 851-7442-1826
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-colors duration-300">
                    ✉️
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white transition-colors duration-300">
                      Email
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      mKhoiruzz21@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-colors duration-300">
                    🕐
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white transition-colors duration-300">
                      {t('Jam Operasional', 'Operating Hours')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      {t('Senin - Minggu', 'Monday - Sunday')}<br />08:00 - 17:00 WIB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Kontak */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300">
              <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-6 transition-colors duration-300">
                {t('Kirim Pesan', 'Send Message')}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                      {t('Nama Lengkap', 'Full Name')} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-300"
                      placeholder={t('Masukkan nama lengkap', 'Enter full name')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-300"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                    {t('Subjek', 'Subject')} *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-300"
                    placeholder={t('Subjek pesan', 'Message subject')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                    {t('Pesan', 'Message')} *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-300"
                    placeholder={t('Tulis pesan Anda di sini...', 'Write your message here...')}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 dark:bg-emerald-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                >
                  {loading ? t('Mengirim...', 'Sending...') : t('Kirim Pesan', 'Send Message')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;