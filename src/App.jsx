import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
import Accesories from './pages/Accesories'
import AdminDashboard from './components/AdminDashboard'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <ErrorBoundary>
              <div className="App">
                <Navbar />
                <main className="min-h-screen flex flex-col">
                  <ErrorBoundary>
                    <Routes>
                      {/* Your existing routes */}
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
                      <Route path="/accesories" element={<Accesories />} />
                      <Route path="/images/*" element={null} />
                      <Route path="/admin" element={<AdminDashboard />} />
                    </Routes>
                  </ErrorBoundary>
                </main>
                <Footer />
                <ToastContainer position="bottom-right" />
              </div>
            </ErrorBoundary>
          </Router>
        </CartProvider>
      </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App