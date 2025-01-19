import { useChat } from '@/hooks/useChat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Index() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white">
        <ChatInterface />
      </div>
    </ErrorBoundary>
  );
}

function ChatInterface() {
  const { messages, sendMessage, isSending, isStreaming } = useChat();

  return (
    <div className="container mx-auto p-4 flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
          />
        ))}
      </main>

      <footer>
        <ChatInput onSend={sendMessage} disabled={isSending} />
      </footer>
    </div>
  );
}