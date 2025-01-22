import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './contexts/auth-context';
import { ChatProvider } from './contexts/ChatContext';
import { ErrorBoundary } from './components/error-boundary/ErrorBoundary';
import './app/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
); 