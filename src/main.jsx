import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


import VConsole from 'vconsole';
if (import.meta.env.DEV || window.location.hostname !== 'localhost') {
  new VConsole();
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
