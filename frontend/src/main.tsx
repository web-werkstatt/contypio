import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/i18n'
import App from './App.tsx'

// Gespeicherte Schriftart beim Start anwenden
const savedFont = localStorage.getItem('cms-font-family') || 'Inter';
document.documentElement.style.setProperty('--font-family', `'${savedFont}'`);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
