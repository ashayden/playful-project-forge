import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { ComponentPropsWithoutRef } from 'react';
import { MessageReactions } from "./MessageReactions";
import { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
}

type MarkdownComponentProps = {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
} & ComponentPropsWithoutRef<any>;

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        "flex w-full gap-4 p-4 rounded-lg",
        isUser ? "bg-muted/50" : "bg-background"
      )}
    >
      <div className="flex-1 space-y-2">
        <div className="text-sm font-medium">
          {isUser ? "You" : "Assistant"}
        </div>
        <ReactMarkdown
          className="prose dark:prose-invert max-w-none"
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          components={{
            pre: ({ node, ...props }: MarkdownComponentProps) => (
              <pre {...props} className="relative rounded-lg p-4" />
            ),
            code: ({ node, inline, className, children, ...props }: MarkdownComponentProps) => (
              <code
                className={cn(
                  "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm",
                  className
                )}
                {...props}
              >
                {children}
              </code>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
        {message.reactions && <MessageReactions reactions={message.reactions} />}
      </div>
    </div>
  );
};