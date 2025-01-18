import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { logger } from '@/services/loggingService';
import App from './App';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);

try {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  logger.error('Failed to render app:', error);
  container.innerHTML = '<div style="padding: 20px;">Failed to start the application. Please try refreshing the page.</div>';
}
