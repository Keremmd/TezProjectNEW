import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Uygulama yüklenmeden önce tema tercihini uygula (Landing + Dashboard aynı tema)
(function applyTheme() {
  const stored = localStorage.getItem('theme')
  const prefersLight = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches
  const isDark = stored === 'dark' || (stored !== 'light' && !prefersLight)
  document.documentElement.classList.toggle('dark', isDark)
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
