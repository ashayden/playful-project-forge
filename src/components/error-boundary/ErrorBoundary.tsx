import React from 'react';
import { Button } from '@/components/ui/button';
import { AIError } from '@/types/ai';
import { logger } from '@/services/loggingService';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('Error caught by boundary:', {
      error,
      componentStack: errorInfo.componentStack,
    });
    this.props.onError?.(error);
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const isAIError = error instanceof AIError;

      return (
        <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {isAIError ? 'AI Service Error' : 'Something went wrong'}
            </h2>
            <p className="text-muted-foreground">
              {isAIError ? error.message : 'An unexpected error occurred'}
            </p>
            {isAIError && error.details && (
              <pre className="p-2 mt-2 text-sm bg-muted rounded-md">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={this.handleRetry} variant="default">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 