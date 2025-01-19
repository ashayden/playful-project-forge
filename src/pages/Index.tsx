import { useChat } from '@/hooks/useChat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Index() {
  const {
    conversations,
    currentConversation,
    createConversation,
    setCurrentConversation,
    deleteConversation,
    isCreating,
    isDeleting
  } = useChat();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white flex">
        {/* Simplified Sidebar */}
        <div className="w-64 bg-gray-800 p-4 flex flex-col border-r border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Chats</h2>
            <button
              onClick={() => createConversation('New Chat')}
              disabled={isCreating}
              className="p-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {conversations.map(chat => (
              <div
                key={chat.id}
                onClick={() => setCurrentConversation(chat)}
                className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                  currentConversation?.id === chat.id ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                <span className="truncate">{chat.title || 'New Chat'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(chat.id);
                  }}
                  disabled={isDeleting}
                  className="p-1 hover:bg-red-600 rounded opacity-0 hover:opacity-100 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat Interface */}
        <div className="flex-1">
          <ChatInterface />
        </div>
      </div>
    </ErrorBoundary>
  );
}

function ChatInterface() {
  const { messages, sendMessage, isSending, isStreaming } = useChat();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-gray-700 bg-gray-900 p-4">
        <ChatInput onSend={sendMessage} disabled={isSending} />
      </div>
    </div>
  );
}