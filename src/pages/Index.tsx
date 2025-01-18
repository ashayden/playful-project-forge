import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/services/loggingService";

const ChatInterface = () => {
  logger.debug('ChatInterface initializing...');
  
  const { user, signOut } = useAuth();
  const { 
    state,
    isLoading,
    error,
    createConversation,
    messages,
    sendMessage,
    isSending,
  } = useChat();
  const { toast } = useToast();

  useEffect(() => {
    const initializeChat = async () => {
      logger.debug('Initializing chat...', { userId: user?.id });
      try {
        // Create initial conversation if none exists
        if (!state.currentConversation && !isLoading) {
          logger.debug('No current conversation, creating new one...');
          createConversation('New Chat');
          logger.debug('Initial conversation created');
        }
      } catch (error) {
        logger.error('Failed to initialize chat:', error);
        toast({
          title: "Error",
          description: "Failed to initialize chat",
          variant: "destructive",
        });
      }
    };

    if (user) {
      logger.debug('User authenticated, initializing chat...', { userId: user.id });
      initializeChat();
    } else {
      logger.debug('No user authenticated');
    }
  }, [user, state.currentConversation, isLoading]);

  if (error) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex justify-between items-center p-4 border-b">
        <ModelSelector />
        <Button onClick={() => signOut()}>Sign Out</Button>
      </header>

      <main className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isSending && (
          <div className="animate-pulse">
            <ChatMessage
              message={{
                id: 'loading',
                role: 'assistant',
                content: 'Thinking...',
                conversation_id: state.currentConversation?.id ?? '',
                user_id: null,
                created_at: new Date().toISOString(),
              }}
            />
          </div>
        )}
      </main>

      <footer className="p-4 border-t">
        <ChatInput
          onSend={sendMessage}
          disabled={isSending || !state.currentConversation}
        />
      </footer>
    </div>
  );
};

export default ChatInterface;