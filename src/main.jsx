import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminPortal from './AdminPortal.jsx'
import { registerServiceWorker, setupPWAInstallPrompt } from './pwaInstall.js'
import { requestPersistentStorage } from './lib/authSession.js'

const isAdminRoute = window.location.pathname.startsWith('/architect-vault-7x2k')

const disableMediaContextMenu = (event) => {
  const target = event.target;
  if (target instanceof Element && target.closest('img, video, canvas, svg')) {
    event.preventDefault();
  }
};

document.addEventListener('contextmenu', disableMediaContextMenu, { capture: true });
document.addEventListener('dragstart', disableMediaContextMenu, { capture: true });
setupPWAInstallPrompt();
registerServiceWorker();
// Ask the browser not to evict our saved session. Fire-and-forget: the app works
// either way, this just stops installed home-screen copies losing the login.
requestPersistentStorage();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdminRoute ? <AdminPortal /> : <App />}
  </StrictMode>,
)