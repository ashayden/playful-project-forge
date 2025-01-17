import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, CardSkeleton, ProfileSkeleton, TableRowSkeleton } from '../skeleton';

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('renders with default classes', () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
    });

    it('accepts additional className', () => {
      render(<Skeleton data-testid="skeleton" className="custom-class" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('custom-class');
    });
  });

  describe('CardSkeleton', () => {
    it('renders card structure', () => {
      render(<CardSkeleton />);
      const card = screen.getByTestId('card-skeleton');
      expect(card).toHaveClass('rounded-xl', 'border', 'bg-card', 'text-card-foreground', 'shadow');
    });
  });

  describe('ProfileSkeleton', () => {
    it('renders profile structure', () => {
      render(<ProfileSkeleton />);
      const avatar = screen.getByTestId('profile-avatar');
      expect(avatar).toHaveClass('h-12', 'w-12', 'rounded-full');
    });
  });

  describe('TableRowSkeleton', () => {
    it('renders table row structure', () => {
      render(<TableRowSkeleton />);
      const row = screen.getByTestId('table-row');
      expect(row).toHaveClass('flex', 'items-center', 'space-x-4', 'p-4');
    });
  });
}); 