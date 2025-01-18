import { useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { LoadingState } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { withAuth } from '@/components/withAuth';
import { logger } from '@/services/loggingService';

function ChatInterface() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    isSending,
    conversations,
    createConversation,
    currentConversation,
    setCurrentConversation
  } = useChat();

  useEffect(() => {
    if (!currentConversation && conversations?.length === 0) {
      logger.debug('No conversation found, creating new one');
      createConversation('New Chat');
    } else if (!currentConversation && conversations?.length > 0) {
      logger.debug('Setting current conversation to latest:', conversations[0]);
      setCurrentConversation(conversations[0]);
    }
  }, [currentConversation, conversations, createConversation, setCurrentConversation]);

  if (error) {
    throw error;
  }

  if (isLoading) {
    return <LoadingState message="Loading chat..." />;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Chat</h1>
        <ModelSelector />
      </header>

      <main className="flex-1 overflow-auto p-4 space-y-4">
        <ErrorBoundary>
          {messages?.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </ErrorBoundary>
      </main>

      <footer className="border-t p-4">
        <ChatInput
          onSend={sendMessage}
          disabled={isSending || !currentConversation}
        />
      </footer>
    </div>
  );
}

export default withAuth(ChatInterface);