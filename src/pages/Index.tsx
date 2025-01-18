import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { LoadingState } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useChat } from '@/contexts/ChatContext';
import { withAuth } from '@/components/withAuth';

function ChatInterface() {
  const { messages, isLoading, currentConversation, sendMessage } = useChat();

  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col bg-zinc-900">
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/50">
          <ModelSelector />
        </header>

        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <LoadingState message="Loading messages..." />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-zinc-500">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl divide-y divide-zinc-800">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
        </main>

        <footer className="border-t border-zinc-800 bg-zinc-900/90 p-4 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/50">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              onSend={sendMessage}
              disabled={isLoading || !currentConversation}
            />
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default withAuth(ChatInterface);