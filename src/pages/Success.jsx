// src/pages/Success.jsx
import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = location.state || {};

  useEffect(() => {
    // Redirect jika tidak ada orderId setelah 5 detik
    if (!orderId) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [orderId, navigate]);

  const openGmail = () => {
    window.open('https://mail.google.com', '_blank');
  };

  // PESAN YANG DIPERBAIKI: Tampilkan pesan lebih informatif
  if (!orderId) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>❌</div>
          <h1 style={styles.errorTitle}>Pesanan Gagal Diproses</h1>
          <p style={styles.message}>
            Maaf, terjadi kesalahan dalam memproses pesanan Anda.
          </p>
          <div style={styles.troubleshoot}>
            <p><strong>Kemungkinan penyebab:</strong></p>
            <ul style={styles.troubleshootList}>
              <li>Data pesanan tidak tersimpan dengan benar</li>
              <li>Koneksi internet terputus saat proses checkout</li>
              <li>Terjadi kesalahan sistem</li>
            </ul>
          </div>
          <p style={styles.redirectMessage}>
            Anda akan diarahkan ke beranda dalam 5 detik...
          </p>
          <div style={styles.actions}>
            <Link to="/" style={styles.primaryButton}>
              Kembali ke Beranda Sekarang
            </Link>
            <Link to="/cart" style={styles.secondaryButton}>
              Coba Lagi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.successIcon}>✅</div>
        <h1 style={styles.title}>Pesanan Berhasil!</h1>
        <p style={styles.message}>
          Terima kasih telah berbelanja di toko kami. Pesanan Anda sedang diproses.
        </p>
        
        {orderId && (
          <div style={styles.orderInfo}>
            <p><strong>Nomor Pesanan:</strong> #{orderId}</p>
            <p>Kami akan mengirimkan konfirmasi via email dalam beberapa menit.</p>
          </div>
        )}

        <div style={styles.actions}>
          <Link to="/" style={styles.primaryButton}>
            Kembali ke Beranda
          </Link>
          <button onClick={openGmail} style={styles.secondaryButton}>
            Lihat Pesanan Di Gmail
          </button>
          <Link to="/orders" style={styles.tertiaryButton}>
            Lihat Daftar Pesanan Saya
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%'
  },
  successIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  errorIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  title: {
    color: '#22c55e',
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '16px'
  },
  errorTitle: {
    color: '#dc2626',
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '16px'
  },
  message: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.5'
  },
  redirectMessage: {
    fontSize: '14px',
    color: '#888',
    fontStyle: 'italic',
    marginBottom: '20px'
  },
  orderInfo: {
    backgroundColor: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'left'
  },
  troubleshoot: {
    backgroundColor: '#fef2f2',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'left'
  },
  troubleshootList: {
    margin: '10px 0',
    paddingLeft: '20px',
    textAlign: 'left'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 'bold',
    textAlign: 'center',
    border: 'none',
    cursor: 'pointer'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: '#22c55e',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    border: '2px solid #22c55e',
    fontWeight: 'bold',
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: '16px'
  },
  tertiaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 'bold',
    textAlign: 'center',
    border: 'none',
    cursor: 'pointer'
  }
};

export default Success;