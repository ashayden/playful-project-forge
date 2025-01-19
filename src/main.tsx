import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { logger } from '@/services/loggingService';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        logger.debug('Service Worker registered:', registration);
      })
      .catch((error) => {
        logger.error('Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
