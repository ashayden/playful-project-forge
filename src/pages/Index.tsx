import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { useEffect, useState } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/services/loggingService";

const ChatInterface = () => {
  const { user, signOut } = useAuth();
  const { state, sendMessage, createConversation, loadConversations } = useChat();
  const [model, setModel] = useState('gpt-4o-mini');
  const { toast } = useToast();

  useEffect(() => {
    const initializeChat = async () => {
      logger.debug('Initializing chat...', { userId: user?.id });
      try {
        logger.debug('Loading conversations...');
        await loadConversations();
        logger.debug('Conversations loaded:', { conversationCount: state.conversations.length });

        // Create initial conversation if none exists
        if (!state.currentConversation) {
          logger.debug('No current conversation, creating new one...', { model });
          const newConversation = await createConversation(model);
          logger.debug('Initial conversation created:', { conversationId: newConversation?.id });
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
  }, [user]); // Only run when user changes

  const handleSubmit = async (content: string) => {
    logger.debug('Chat submit triggered:', { content, userId: user?.id });
    try {
      // Ensure there's an active conversation
      if (!state.currentConversation) {
        logger.debug('No active conversation, creating new one...', { model });
        const conversation = await createConversation(model);
        if (!conversation) {
          logger.error('Failed to create conversation');
          toast({
            title: "Error",
            description: "Failed to create conversation",
            variant: "destructive",
          });
          return;
        }
        logger.debug('New conversation created:', { conversationId: conversation.id });
      }
      
      logger.debug('Sending message...', { 
        conversationId: state.currentConversation?.id,
        messageCount: state.messages.length 
      });
      await sendMessage(content);
      logger.debug('Message sent successfully');
    } catch (error) {
      logger.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Please sign in to continue</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">AI Chat Assistant</h1>
          <ModelSelector value={model} onChange={setModel} />
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {user?.email}
          </p>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl">
          {state.messages.map((message, index) => (
            <ChatMessage
              key={message.id || index}
              id={message.id}
              role={message.role}
              content={message.content}
              reactions={message.reactions}
            />
          ))}
        </div>
      </main>

      <footer className="border-t">
        <div className="container mx-auto max-w-4xl">
          <ChatInput onSubmit={handleSubmit} isLoading={state.isLoading} />
        </div>
      </footer>
    </div>
  );
};

const Index = () => (
  <ChatInterface />
);

export default Index;