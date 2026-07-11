import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminPortal from './AdminPortal.jsx'

const isAdminRoute = window.location.pathname.startsWith('/architect-vault-7x2k')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdminRoute ? <AdminPortal /> : <App />}
  </StrictMode>,
)