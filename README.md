# 🌿 Green House - Frontend

Frontend aplikasi e-commerce toko tanaman hias menggunakan React + Vite.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## ⚙️ Environment Variables

Buat file `.env` di root folder `frontend/`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000
```

⚠️ **PENTING**: Jangan commit file `.env` ke GitHub! File ini sudah di-ignore oleh `.gitignore`.

## 📦 Dependencies

### Main Dependencies
- **React 19** - UI library
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Supabase** - Backend services
- **Axios** - HTTP client
- **React Toastify** - Notifications

### Dev Dependencies
- **Vite** - Build tool
- **ESLint** - Linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── ProductCard.jsx
│   │   └── ...
│   ├── pages/          # Page components
│   │   ├── Home.jsx
│   │   ├── Product.jsx
│   │   ├── Checkout.jsx
│   │   └── ...
│   ├── context/        # React Context
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   └── ...
│   ├── services/       # API services
│   │   ├── productsService.js
│   │   ├── tripay.js
│   │   └── ...
│   ├── utils/          # Utility functions
│   │   ├── formatCurrency.js
│   │   └── ...
│   └── lib/            # Library configs
│       └── supabase.js
├── public/             # Static assets
└── package.json
```

## 🎨 Features

- ✅ Responsive Design
- ✅ Dark Mode
- ✅ Multi-language (ID/EN)
- ✅ Shopping Cart
- ✅ Checkout Process
- ✅ Payment Integration
- ✅ Order Management
- ✅ User Authentication
- ✅ Admin Dashboard

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📝 Notes

- Pastikan backend API sudah berjalan sebelum menggunakan fitur yang memerlukan API
- Gunakan environment variables untuk konfigurasi sensitif
- Jangan commit file `.env` ke repository

## 🌐 Deployment

Deploy ke Vercel:

1. Push code ke GitHub
2. Import project ke Vercel
3. Set environment variables
4. Deploy

Lihat [README.md](../README.md) untuk informasi lengkap tentang project.
