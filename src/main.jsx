import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminPortal from './AdminPortal.jsx'

const isAdminRoute = window.location.pathname.startsWith('/architect-vault-7x2k')

const disableMediaContextMenu = (event) => {
  const target = event.target;
  if (target instanceof Element && target.closest('img, video, canvas, svg')) {
    event.preventDefault();
  }
};

document.addEventListener('contextmenu', disableMediaContextMenu, { capture: true });
document.addEventListener('dragstart', disableMediaContextMenu, { capture: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdminRoute ? <AdminPortal /> : <App />}
  </StrictMode>,
)