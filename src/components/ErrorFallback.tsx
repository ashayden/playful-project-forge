interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div role="alert" className="p-4 rounded-lg border bg-destructive/10 text-destructive">
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <pre className="text-sm overflow-auto p-2 bg-background rounded mb-4">
        {error.message}
      </pre>
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
        >
          Try again
        </button>
      )}
    </div>
  );
} 