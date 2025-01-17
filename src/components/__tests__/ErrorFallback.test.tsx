import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorFallback } from '../ErrorFallback';

describe('ErrorFallback', () => {
  it('displays the error message', () => {
    const error = new Error('Test error message');
    render(<ErrorFallback error={error} />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('calls resetErrorBoundary when try again button is clicked', async () => {
    const error = new Error('Test error message');
    const resetErrorBoundary = vi.fn();
    const user = userEvent.setup();
    
    render(<ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />);
    
    const button = screen.getByText('Try again');
    await user.click(button);
    
    expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
  });

  it('does not show try again button when resetErrorBoundary is not provided', () => {
    const error = new Error('Test error message');
    render(<ErrorFallback error={error} />);
    
    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
  });
}); 