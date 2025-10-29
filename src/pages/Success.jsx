// src/pages/Success.jsx
import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = location.state || {};

  useEffect(() => {
    // PERBAIKAN: Tambahkan timeout untuk redirect
    if (!orderId) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [orderId, navigate]);

  const openGmail = () => {
    // Membuka Gmail di tab baru
    window.open('https://mail.google.com', '_blank');
  };

  // PERBAIKAN: Tampilkan pesan jika tidak ada orderId
  if (!orderId) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>⚠️</div>
          <h1 style={styles.title}>Pesanan Tidak Ditemukan</h1>
          <p style={styles.message}>
            Mengarahkan kembali ke beranda...
          </p>
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
  message: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.5'
  },
  orderInfo: {
    backgroundColor: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
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
  }
};

export default Success;