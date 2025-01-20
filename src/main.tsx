import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './contexts/auth-context';
import { ChatProvider } from './contexts/ChatContext';
import { ErrorBoundary } from './components/error-boundary/ErrorBoundary';
import { AuthCallback } from './app/auth/callback/page';
import { AuthPage } from './app/auth/page';
import './app/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ChatProvider>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/chat" element={<App />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </ChatProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  </React.StrictMode>
); 