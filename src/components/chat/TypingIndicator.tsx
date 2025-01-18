import { cn } from "@/lib/utils";

/**
 * Props for the TypingIndicator component
 */
interface TypingIndicatorProps {
  /** Optional CSS classes to apply to the component */
  className?: string;
  /** Whether the component is in streaming state */
  isStreaming?: boolean;
}

/**
 * A component that displays an animated typing indicator with three dots
 * 
 * @component
 * @example
 * ```tsx
 * <TypingIndicator 
 *   isStreaming={true} 
 *   className="bg-zinc-800" 
 * />
 * ```
 */
export function TypingIndicator({ 
  className, 
  isStreaming = false 
}: TypingIndicatorProps) {
  // Animation delays for each dot
  const DELAYS = {
    FIRST: '-0.3s',
    SECOND: '-0.15s',
    THIRD: '0s'
  };

  // Base styles for the dots
  const dotBaseStyles = cn(
    "h-2 w-2 rounded-full",
    "transition-all duration-300",
    isStreaming ? "bg-primary" : "bg-zinc-400"
  );

  return (
    <div 
      role="status"
      aria-label="Loading"
      className={cn(
        // Layout and spacing
        "flex items-center space-x-1.5",
        "px-2.5 py-2",
        // Transitions
        "transition-all duration-300",
        // Conditional streaming styles
        isStreaming && "bg-primary/10",
        className
      )}
    >
      {/* First Dot */}
      <div className={cn(
        dotBaseStyles,
        "animate-bounce",
        `[animation-delay:${DELAYS.FIRST}]`
      )} />
      
      {/* Second Dot */}
      <div className={cn(
        dotBaseStyles,
        "animate-bounce",
        `[animation-delay:${DELAYS.SECOND}]`
      )} />
      
      {/* Third Dot */}
      <div className={cn(
        dotBaseStyles,
        "animate-bounce",
        `[animation-delay:${DELAYS.THIRD}]`
      )} />
    </div>
  );
} 