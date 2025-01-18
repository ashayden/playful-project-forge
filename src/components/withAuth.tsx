import { ComponentType } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from './LoadingSpinner';
import { Navigate } from 'react-router-dom';

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: { redirectTo?: string } = {}
) {
  return function WithAuthComponent(props: P) {
    const { session, isLoading } = useAuth();

    if (isLoading) {
      return <LoadingState message="Checking authentication..." />;
    }

    if (!session) {
      return <Navigate to={options.redirectTo || '/auth'} replace />;
    }

    return <WrappedComponent {...props} />;
  };
} 