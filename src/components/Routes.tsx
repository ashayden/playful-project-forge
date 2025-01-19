import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { LoadingState } from '@/components/LoadingSpinner';
import { AppLayout } from '@/components/AppLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Auth from '@/pages/Auth';

function Index() {
  return (
    <ErrorBoundary>
      <div className="flex-1 flex flex-col">
        <ChatInterface />
      </div>
    </ErrorBoundary>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingState message="Checking authentication..." />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

export function Routes() {
  return (
    <RouterRoutes>
      <Route path="/auth" element={<Auth />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Index />} />
      </Route>
    </RouterRoutes>
  );
} 