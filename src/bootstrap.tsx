import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import './index.css'
import App from './App.tsx'
import { syncProEntitlement } from './features/purchase'

/** Se importa recién cuando el idioma ya está decidido (ver main.tsx). */
export function start() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  void syncProEntitlement()
}
