import { useSupabaseStatus } from '@/hooks/useSupabaseStatus';
import { useChat } from '@/hooks/useChat';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ConversationSidebar } from '@/components/ConversationSidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Index() {
  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden">
        <ConversationSidebar />
        <ChatInterface />
      </div>
    </ErrorBoundary>
  );
}

function ChatInterface() {
  const { currentConversation, messages, sendMessage, isSending, isStreaming } = useChat();
  const { status, latency } = useSupabaseStatus();

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-background">
      <header className="flex-none p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            {currentConversation?.title || 'New Chat'}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant={status === 'connected' ? 'default' : 'destructive'}>
              {status}
            </Badge>
            {status === 'connected' && (
              <Badge variant="outline">{latency}ms</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
          />
        ))}
      </main>

      <footer className="flex-none p-4 border-t border-border">
        <ChatInput onSend={sendMessage} disabled={isSending} />
      </footer>
    </div>
  );
}