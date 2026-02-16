import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import { AuthProvider } from './hooks/useAuth';

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
      <Toaster richColors position="top-center" />
    </AuthProvider>
  </React.StrictMode>
);
