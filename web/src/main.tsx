import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';
import { AuthProvider } from './hooks/useAuth';

function getRouterBasename(baseUrl: string): string {
  if (!baseUrl || baseUrl === '/') return '/';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

const routerBasename = getRouterBasename(import.meta.env.BASE_URL);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter basename={routerBasename}>
        <App />
      </BrowserRouter>
      <Toaster richColors position="top-center" />
    </AuthProvider>
  </React.StrictMode>
);
