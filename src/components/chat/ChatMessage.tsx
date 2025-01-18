import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ComponentPropsWithoutRef } from 'react';
import { TypingIndicator } from './TypingIndicator';

interface ChatMessageProps extends ComponentPropsWithoutRef<'div'> {
  message: Message;
  isTyping?: boolean;
}

interface CodeProps extends ComponentPropsWithoutRef<'code'> {
  inline?: boolean;
}

export function ChatMessage({ message, isTyping = false, className, ...props }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const showTyping = isAssistant && isTyping;

  return (
    <div
      className={cn(
        'group relative flex gap-4 px-4 py-6 transition-colors duration-300',
        isAssistant && 'bg-zinc-900/50',
        className
      )}
      {...props}
    >
      <div className={cn(
        "flex-1 space-y-4 transition-opacity duration-200",
        showTyping && "opacity-40"
      )}>
        <div className="min-h-[20px] text-base text-zinc-100">
          <div className="prose prose-invert max-w-none prose-p:leading-7 prose-pre:my-4">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              components={{
                pre: ({ node, ...props }) => (
                  <div className="relative my-4">
                    <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm" {...props} />
                  </div>
                ),
                code: ({ inline, ...props }: CodeProps) =>
                  inline ? (
                    <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-sm font-medium text-zinc-200" {...props} />
                  ) : (
                    <code {...props} />
                  ),
                p: ({ children }) => <p className="mb-4 last:mb-0 text-zinc-200">{children}</p>,
              }}
            >
              {message.content || ' '}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      {showTyping && (
        <div className="absolute bottom-2 left-4">
          <TypingIndicator />
        </div>
      )}
    </div>
  );
}