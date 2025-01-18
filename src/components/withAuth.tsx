import { ComponentType } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from './LoadingSpinner';
import { Navigate } from 'react-router-dom';
import { logger } from '@/services/loggingService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: { redirectTo?: string } = {}
) {
  return function WithAuthComponent(props: P) {
    const { session, isLoading, error, user } = useAuth();

    if (isLoading) {
      return <LoadingState message="Checking authentication..." />;
    }

    if (error) {
      logger.error('Authentication error:', error);
      return (
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription className="mt-2">
              {error.message}
            </AlertDescription>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </Alert>
        </div>
      );
    }

    if (!session || !user) {
      logger.debug('No authenticated session found, redirecting to auth page');
      return <Navigate to={options.redirectTo || '/auth'} replace />;
    }

    return <WrappedComponent {...props} />;
  };
} 