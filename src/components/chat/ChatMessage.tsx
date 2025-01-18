import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ComponentPropsWithoutRef } from 'react';

interface ChatMessageProps extends ComponentPropsWithoutRef<'div'> {
  message: Message;
}

export function ChatMessage({ message, className, ...props }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'group relative flex gap-3 py-3',
        isAssistant && 'bg-zinc-800/40',
        className
      )}
      {...props}
    >
      <div className="flex-1 space-y-2 overflow-hidden px-1">
        <div className="min-h-[20px] text-sm">
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              components={{
                pre: ({ node, ...props }) => (
                  <div className="relative my-2">
                    <pre className="overflow-x-auto rounded-lg bg-zinc-800 p-4" {...props} />
                  </div>
                ),
                code: ({ node, inline, ...props }) =>
                  inline ? (
                    <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-sm" {...props} />
                  ) : (
                    <code {...props} />
                  ),
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}