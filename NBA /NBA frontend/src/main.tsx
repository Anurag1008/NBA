import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider.tsx';
import PersistLogin from './components/PersistLogin.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PersistLogin>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </PersistLogin>

      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
