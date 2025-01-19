import { cn } from '@/lib/utils';

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <span className={cn('inline-flex items-center space-x-1', className)}>
      {[...Array(3)].map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-1 w-1 rounded-full bg-current opacity-50',
            'animate-pulse',
            i === 0 && '[animation-delay:0ms]',
            i === 1 && '[animation-delay:200ms]',
            i === 2 && '[animation-delay:400ms]'
          )}
        />
      ))}
    </span>
  );
} 