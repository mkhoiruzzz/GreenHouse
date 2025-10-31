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
import AdminOrders from './pages/AdminOrders'
import About from './pages/About'
import Contact from './pages/Contact'
import Profil from './pages/Profile'
import Accesories from './pages/Accesories'
import TestSupabase from './components/TestSupabase'
import DeleteAccount from './components/DeleteAccount';




function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="min-h-screen flex flex-col">
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
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin" element={<AdminOrders />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/profile" element={<Profil />} />
                <Route path="/accesories" element={<Accesories />} />
                <Route path="/testsupabase" element={<TestSupabase />} /> {/* ✅ PERBAIKI TYPO */}
                <Route path="/delete-account" element={<DeleteAccount />} /> {/* ✅ TAMBAHKAN ROUTE MODAL */}
                <Route path="/images/*" element={null} />
              </Routes>
            </main>
            <Footer />
            <ToastContainer position="bottom-right" />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}


export default App