import { FallbackProps } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type ErrorFallbackProps = Omit<FallbackProps, 'resetErrorBoundary'> & {
  resetErrorBoundary?: FallbackProps['resetErrorBoundary'];
};

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <Alert variant="destructive" className="m-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="mt-2 space-y-4">
        <p className="text-sm">{error.message}</p>
        {resetErrorBoundary && (
          <Button onClick={resetErrorBoundary} variant="outline" size="sm">
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
} 