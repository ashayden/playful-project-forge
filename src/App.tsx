/**
 * Root application component that sets up the app's providers and routing.
 * Includes providers for:
 * - Error Boundary: Global error handling
 * - React Query: Data fetching and caching
 * - React Router: Client-side routing
 * - Auth: User authentication
 * - Chat: Chat functionality
 * - UI Components: Tooltips and notifications
 */

import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/components/AuthProvider';
import { ChatProvider } from '@/contexts/ChatContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Routes } from './components/Routes';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@/components/ui/theme-provider';

// Configure React Query client with optimal settings for chat application
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry failed queries once
      refetchOnWindowFocus: false, // Disable automatic refetch on window focus
    },
  },
});

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="app-theme">
      <div className="min-h-screen bg-background font-sans antialiased">
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AuthProvider>
                <ChatProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <Routes />
                  </TooltipProvider>
                </ChatProvider>
              </AuthProvider>
            </BrowserRouter>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}