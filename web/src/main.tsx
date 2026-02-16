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

console.info('[bootstrap] Runtime path diagnostics:', {
  href: window.location.href,
  origin: window.location.origin,
  pathname: window.location.pathname,
  viteBaseUrl: import.meta.env.BASE_URL,
  routerBasename
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    console.info('[bootstrap] Existing service workers:', registrations.length);
    registrations.forEach((registration) => {
      console.info('[bootstrap] Unregistering service worker scope:', registration.scope);
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
