import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log(
  '%c Hi, fellow dev 👋 %c\nLike reading source? Try ⌘K, or ↑↑↓↓←→←→BA.\nsalarsattiss@gmail.com',
  'font: 700 16px system-ui; background: #e5e5e5; color: #0b0b14; padding: 4px 8px; border-radius: 4px',
  'font: 12px ui-monospace, monospace',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
