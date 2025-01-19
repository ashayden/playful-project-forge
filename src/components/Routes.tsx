import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { LoadingState } from '@/components/LoadingSpinner';
import { AppLayout } from '@/components/AppLayout';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';

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