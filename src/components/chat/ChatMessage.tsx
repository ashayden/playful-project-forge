import { Message } from '@/types/messages';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ComponentPropsWithoutRef } from 'react';
import { TypingIndicator } from './TypingIndicator';
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

  // Markdown components configuration
  const markdownComponents: Components = {
    pre({ children }) {
      return (
        <div className="relative my-4">
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm">
            {children}
          </pre>
        </div>
      );
    },
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !(match || (children as Element[])?.[0]?.tagName === 'pre');
      const lang = match ? match[1] : '';

      if (isInline) {
        return (
          <code 
            className={cn(
              "rounded-md bg-zinc-800 px-1.5 py-0.5 text-sm font-medium text-zinc-200",
              className || undefined
            )}
          >
            {children}
          </code>
        );
      }

      return (
        <code className={cn(className || undefined, lang && `language-${lang}`)}>
          {children}
        </code>
      );
    },
    p({ children }) {
      return (
        <p className={cn(
          "mb-4 last:mb-0 text-zinc-200",
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
        'group relative flex gap-4 px-4 py-6',
        // Transitions
        'transition-all duration-300',
        // Background styles
        isAssistant && 'bg-zinc-900/50 hover:bg-zinc-900/70',
        isCurrentlyStreaming && 'bg-zinc-900/70',
        className
      )}
      {...props}
    >
      {/* Message Content */}
      <div className={cn(
        "flex-1 space-y-4",
        "transition-all duration-300",
        showTypingIndicator && "opacity-80"
      )}>
        <div className="min-h-[20px] text-base text-zinc-100">
          <div className={cn(
            "prose prose-invert max-w-none",
            "prose-p:leading-7 prose-pre:my-4",
            isCurrentlyStreaming && "animate-pulse"
          )}>
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {message.content || ' '}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Typing Indicator */}
      {showTypingIndicator && (
        <div className={cn(
          "absolute bottom-2 left-4",
          "transition-all duration-300",
          isCurrentlyStreaming && "scale-110"
        )}>
          <TypingIndicator 
            isStreaming={isCurrentlyStreaming}
            className="bg-zinc-800/50 rounded-full backdrop-blur-sm" 
          />
        </div>
      )}
    </div>
  );
}