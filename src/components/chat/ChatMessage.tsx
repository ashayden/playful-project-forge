import { Message } from '@/types/messages';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ComponentPropsWithoutRef } from 'react';
import { TypingIndicator } from './TypingIndicator';
import { CheckIcon, AlertCircle, Clock } from 'lucide-react';
import type { Components } from 'react-markdown';
import type { Element } from 'hast';

/**
 * Props for the ChatMessage component
 */
interface ChatMessageProps extends ComponentPropsWithoutRef<'div'> {
  /** The message object containing content and metadata */
  message: Message;
  /** Whether the message is currently being typed */
  isTyping?: boolean;
  /** Whether the message is currently streaming from the AI */
  isStreaming?: boolean;
  streamingMessageId?: string | null;
}

/**
 * Component that renders a chat message with support for markdown, code blocks,
 * and streaming indicators
 */
export function ChatMessage({ 
  message, 
  isTyping = false, 
  isStreaming = false,
  streamingMessageId = null,
  className, 
  ...props 
}: ChatMessageProps) {
  // Determine if this is an AI assistant message
  const isAssistant = message.role === 'assistant';
  
  // A message is streaming if it's an assistant message and either:
  // 1. It's the current streaming message (tracked by ID)
  // 2. It has is_streaming=true in the database
  const isCurrentlyStreaming = !!(isAssistant && message.id && (
    message.id === streamingMessageId || 
    message.is_streaming
  ));

  // Show typing indicator for streaming messages or when explicitly set
  const showTypingIndicator = isAssistant && (isTyping || isCurrentlyStreaming);

  // Message status indicator
  const StatusIndicator = () => {
    if (message.severity === 'error') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (!message.id || message.id.startsWith('temp-')) return <Clock className="h-4 w-4 text-zinc-500 animate-pulse" />;
    if (isCurrentlyStreaming) return <TypingIndicator className="h-4" />;
    return <CheckIcon className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />;
  };

  // Markdown components configuration
  const markdownComponents: Components = {
    pre({ children }) {
      return (
        <div className="relative my-4 group">
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm">
            {children}
          </pre>
          <button 
            onClick={() => navigator.clipboard.writeText(children?.toString() || '')}
            className="absolute top-2 right-2 p-2 rounded-md bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Copy code"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        </div>
      );
    },
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !(match || (children as Element[])?.[0]?.tagName === 'pre');
      const lang = match ? match[1] : '';

      if (isInline) {
        return (
          <code className={cn(
            "rounded-md bg-zinc-800 px-1.5 py-0.5 text-sm font-medium text-zinc-200",
            className
          )}>
            {children}
          </code>
        );
      }

      return (
        <code className={cn(className, lang && `language-${lang}`)}>
          {children}
        </code>
      );
    },
    p({ children }) {
      return (
        <p className={cn(
          "mb-4 last:mb-0 text-zinc-200 leading-7",
          isCurrentlyStreaming && "animate-pulse"
        )}>
          {children}
        </p>
      );
    },
  };

  return (
    <div
      role={isAssistant ? 'log' : 'comment'}
      aria-live={isCurrentlyStreaming ? 'polite' : 'off'}
      className={cn(
        // Base layout
        'group relative flex gap-4 px-6 py-6',
        // Message type styles
        isAssistant ? 'bg-zinc-900/50 hover:bg-zinc-900/70' : 'hover:bg-zinc-800/30',
        // Animation and transitions
        'transition-all duration-300 ease-in-out',
        // Status-based styles
        isCurrentlyStreaming && 'bg-zinc-900/70',
        message.severity === 'error' && 'bg-red-900/20',
        !message.id || message.id.startsWith('temp-') && 'opacity-80',
        className
      )}
      {...props}
    >
      {/* Avatar or Icon */}
      <div className="flex-shrink-0 w-8 h-8">
        <div className={cn(
          "w-full h-full rounded-full flex items-center justify-center",
          isAssistant ? "bg-blue-600" : "bg-zinc-700"
        )}>
          <span className="text-sm font-semibold text-white">
            {isAssistant ? "AI" : "U"}
          </span>
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {message.content || ' '}
          </ReactMarkdown>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex-shrink-0 self-start mt-1">
        <StatusIndicator />
      </div>
    </div>
  );
}