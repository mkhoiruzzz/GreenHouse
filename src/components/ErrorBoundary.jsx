import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state agar render berikutnya menampilkan fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error ke console
    console.error('🔴 Error caught by ErrorBoundary:', error);
    console.error('📍 Error Info:', errorInfo);
    
    // Simpan error info ke state
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Anda bisa kirim error ke logging service di sini
    // Contoh: logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  }

  handleGoHome = () => {
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
              <div className="flex items-center justify-center">
                <div className="text-6xl mb-2">⚠️</div>
              </div>
              <h1 className="text-3xl font-bold text-white text-center">
                Oops! Something Went Wrong
              </h1>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 text-center mb-4">
                  Maaf, terjadi kesalahan yang tidak terduga. Tim kami sudah diberitahu dan akan segera memperbaikinya.
                </p>
                
                {/* Error Details - hanya tampilkan di development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <summary className="cursor-pointer font-semibold text-gray-800 mb-2">
                      🔍 Technical Details (Development Only)
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-700">Error Message:</p>
                        <p className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded mt-1">
                          {this.state.error.toString()}
                        </p>
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700">Stack Trace:</p>
                          <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-40">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  🔄 Reload Halaman
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 bg-white border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  🏠 Kembali ke Home
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <span className="text-blue-600 mr-3 text-xl">💡</span>
                  <div>
                    <p className="text-blue-900 font-semibold text-sm mb-1">
                      Tips untuk mengatasi masalah:
                    </p>
                    <ul className="text-blue-700 text-xs space-y-1 list-disc list-inside">
                      <li>Reload halaman ini</li>
                      <li>Clear cache browser Anda</li>
                      <li>Coba gunakan browser yang berbeda</li>
                      <li>Hubungi customer support jika masalah berlanjut</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Jika tidak ada error, render children seperti biasa
    return this.props.children;
  }
}

export default ErrorBoundary;