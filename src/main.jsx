import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

// Configurazione React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error.response?.status >= 400 && error.response?.status < 500) return false;
        return failureCount < 3;
      }
    }
  }
});

// Inizializza Sentry per errori globali (opzionale)
if (import.meta.env.VITE_SENTRY_DSN) {
  import('./utils/sentry').then(({ initSentry }) => initSentry());
}

// Renderizza l'applicazione
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <App />
          </div>
        </Router>
      </AuthProvider>
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  </React.StrictMode>
);

// Service Worker per PWA (opzionale)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed:', registrationError);
      });
  });
}
