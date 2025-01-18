import { Message } from '@/types/messages';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ComponentPropsWithoutRef } from 'react';
import { TypingIndicator } from './TypingIndicator';
import { CheckIcon, AlertCircle, Clock, MoreVertical, Copy, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import type { Components } from 'react-markdown';
import type { Element } from 'hast';

interface ChatMessageProps extends ComponentPropsWithoutRef<'div'> {
  message: Message;
  isTyping?: boolean;
  streamingMessageId?: string | null;
  onDelete?: (messageId: string) => Promise<void>;
}

export function ChatMessage({ 
  message, 
  isTyping = false,
  streamingMessageId = null,
  onDelete,
  className, 
  ...props 
}: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const isCurrentlyStreaming = !!(isAssistant && message.id && (
    message.id === streamingMessageId || 
    message.is_streaming
  ));

  // Message status indicator
  const StatusIndicator = () => {
    if (message.severity === 'error') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (!message.id || message.id.startsWith('temp-')) return <Clock className="h-4 w-4 text-zinc-500 animate-pulse" />;
    if (isCurrentlyStreaming) return <TypingIndicator isStreaming={true} className="h-4" />;
    return <CheckIcon className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success('Message copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  const handleDelete = async () => {
    if (!message.id || !onDelete) return;
    try {
      await onDelete(message.id);
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
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

      {/* Actions and Status */}
      <div className="flex flex-col items-end gap-2">
        {/* Message Actions */}
        {!isCurrentlyStreaming && !isTyping && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="p-1 rounded-md hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Message actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Status Indicator */}
        <div className="flex-shrink-0">
          <StatusIndicator />
        </div>
      </div>
    </div>
  );
}