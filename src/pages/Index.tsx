import { useEffect, useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { LoadingState } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { withAuth } from '@/components/withAuth';
import { logger } from '@/services/loggingService';
import { useToast } from '@/hooks/use-toast';

function ChatInterface() {
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(true);
  const {
    messages = [],
    isLoading,
    error,
    sendMessage,
    isSending,
    conversations = [],
    createConversation,
    currentConversation,
    setCurrentConversation
  } = useChat();

  useEffect(() => {
    let mounted = true;

    const initializeConversation = async () => {
      try {
        if (!currentConversation) {
          if (conversations.length === 0) {
            logger.debug('No conversation found, creating new one');
            await createConversation('New Chat');
            // Wait for conversations to update through React Query
            if (mounted && conversations.length > 0) {
              setCurrentConversation(conversations[0]);
            }
          } else {
            logger.debug('Setting current conversation to latest:', conversations[0]);
            setCurrentConversation(conversations[0]);
          }
        }
      } catch (err) {
        logger.error('Failed to initialize conversation:', err);
        if (mounted) {
          toast({
            title: "Error",
            description: "Failed to create conversation. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeConversation();

    return () => {
      mounted = false;
    };
  }, [currentConversation, conversations, createConversation, setCurrentConversation, toast]);

  if (error) {
    logger.error('Chat interface error:', error);
    return (
      <ErrorBoundary>
        <div className="flex flex-col h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive">Something went wrong</h2>
            <p className="mt-2 text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (isLoading || isInitializing) {
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
          {messages.map((message) => (
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