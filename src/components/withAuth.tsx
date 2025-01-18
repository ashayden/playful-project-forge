import { ComponentType } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from './LoadingSpinner';
import { Navigate } from 'react-router-dom';
import { logger } from '@/services/loggingService';

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: { redirectTo?: string } = {}
) {
  return function WithAuthComponent(props: P) {
    const { session, isLoading, user } = useAuth();

    if (isLoading) {
      return <LoadingState message="Checking authentication..." />;
    }

    if (!session || !user) {
      logger.debug('No authenticated session found, redirecting to auth page');
      return <Navigate to={options.redirectTo || '/auth'} replace />;
    }

    return <WrappedComponent {...props} />;
  };
} 