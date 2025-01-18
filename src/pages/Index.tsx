import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { LoadingState } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useChat } from '@/contexts/ChatContext';
import { withAuth } from '@/components/withAuth';
import { Badge } from '@/components/ui/badge';

function ChatInterface() {
  const { messages, isLoading, currentConversation, sendMessage } = useChat();

  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col bg-[#1E1E1E]">
        <header className="sticky top-0 z-50 border-b border-zinc-800 bg-[#1E1E1E]/90 backdrop-blur supports-[backdrop-filter]:bg-[#1E1E1E]/50">
          <div className="mx-auto max-w-3xl px-4 py-2">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    Development Build
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    v0.0.0
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    {import.meta.env.MODE}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-zinc-900/50 text-zinc-400 border-zinc-700">
                    Messages: {messages.length}
                  </Badge>
                  <Badge variant="outline" className="bg-zinc-900/50 text-zinc-400 border-zinc-700">
                    Latency: 0ms
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-zinc-400">
                This is a development environment for testing the chat interface. All messages are stored in the development database.
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4">
            {isLoading ? (
              <div className="flex h-full items-center justify-center py-8">
                <LoadingState message="Loading messages..." />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center py-8">
                <p className="text-sm text-zinc-400">No messages yet. Start a conversation!</p>
              </div>
            ) : (
              <div className="pb-[200px] pt-4 space-y-6">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </div>
            )}
          </div>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-[#1E1E1E]/90 backdrop-blur supports-[backdrop-filter]:bg-[#1E1E1E]/50">
          <div className="mx-auto max-w-3xl p-4">
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