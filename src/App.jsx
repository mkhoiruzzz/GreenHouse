import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Product from './pages/Product'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import About from './pages/About'
import Contact from './pages/Contact'
import Profil from './pages/Profile'
import AdminDashboard from './components/AdminDashboard'
import ProductForm from './components/ProductForm'
import DebugPage from './pages/DebugPage'
import OrderSuccess from './pages/OrderSuccess'
import Invoice from './pages/Invoice'

const AppContent = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isNoFooterPage = ['/cart', '/checkout', '/order-success', '/orders', '/profile', '/contact'].includes(location.pathname);

  return (
    <div className="App">
      <Navbar />
      <main className="min-h-screen flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Product />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={<Profil />} />
          <Route path="/images/*" element={null} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/add-product" element={<ProductForm />} />
          <Route path="/debug" element={<DebugPage />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/invoice/:orderId" element={<Invoice />} />
        </Routes>
      </main>
      {!isAdminPath && !isNoFooterPage && <Footer />}
      <ToastContainer position="bottom-right" />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;