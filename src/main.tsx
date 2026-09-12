import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Atajo para desbloquear Pro por link, sin devtools — hace falta mientras
// no existe compra real vía StoreKit (ver features/flags.ts). Abrir la app
// una vez con ?pro=1 al final de la URL alcanza: queda guardado en
// localStorage y no hace falta repetirlo en visitas futuras.
try {
  if (new URLSearchParams(window.location.search).get('pro') === '1') {
    localStorage.setItem('valija:isPro', 'true')
    window.history.replaceState(null, '', window.location.pathname)
  }
} catch {
  // localStorage puede fallar (modo privado, cuota llena) — no es crítico
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
