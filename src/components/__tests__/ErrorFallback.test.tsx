import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorFallback } from '../ErrorFallback';

describe('ErrorFallback', () => {
  it('displays the error message', () => {
    const testError = new Error('Test error message');
    const resetErrorBoundary = vi.fn();
    
    render(<ErrorFallback error={testError} resetErrorBoundary={resetErrorBoundary} />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls resetErrorBoundary when try again button is clicked', () => {
    const testError = new Error('Test error message');
    const resetErrorBoundary = vi.fn();
    
    render(<ErrorFallback error={testError} resetErrorBoundary={resetErrorBoundary} />);
    
    screen.getByText('Try again').click();
    expect(resetErrorBoundary).toHaveBeenCalled();
  });

  it('does not show try again button when resetErrorBoundary is not provided', () => {
    const testError = new Error('Test error message');
    const resetErrorBoundary = undefined;
    
    render(<ErrorFallback error={testError} resetErrorBoundary={resetErrorBoundary} />);
    
    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
  });
}); 