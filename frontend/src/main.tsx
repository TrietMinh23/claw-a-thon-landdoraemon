// frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { EmailProvider } from './contexts/EmailContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <EmailProvider>
        <App />
      </EmailProvider>
    </BrowserRouter>
  </StrictMode>,
)
