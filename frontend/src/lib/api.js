// Centralized API base URL helper.
// In dev: set VITE_API_URL=http://localhost:3001 in .env.local
// In prod (Vercel): VITE_API_URL is set via Vercel env vars or .env.production
const PROD_URL = 'https://tezproject-backend.onrender.com'
const RAW = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : PROD_URL)

export const API_URL = RAW.replace(/\/+$/, '')

export const apiUrl = (path = '') => {
  if (!path) return API_URL
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
}
