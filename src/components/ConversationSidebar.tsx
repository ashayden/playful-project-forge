import { Plus, MessageSquare, Settings, Trash2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { Conversation } from '@/types/chat';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

export function ConversationSidebar() {
  const {
    conversations,
    currentConversation,
    createConversation,
    setCurrentConversation,
    isCreating,
    deleteConversation,
    isDeleting,
  } = useChat();

  // Filter out conversations without responses unless they're the current conversation
  const visibleConversations = conversations.filter(
    conv => conv.has_response || conv.id === currentConversation?.id
  );

  const handleNewChat = () => {
    createConversation('New Chat');
  };

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (currentConversation?.id === conversationId) {
      const nextConversation = visibleConversations.find((c: Conversation) => c.id !== conversationId);
      if (nextConversation) {
        setCurrentConversation(nextConversation);
      }
    }
    
    await deleteConversation(conversationId);
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar side="left" variant="floating" collapsible="icon" className="w-72">
        <SidebarHeader className="h-10 min-h-[2.5rem] px-2">
          <div className="flex items-center justify-between h-full">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              disabled={isCreating}
              className="h-7 w-7"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">New Chat</span>
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 py-1 text-xs">Recent Conversations</SidebarGroupLabel>
            <div className="space-y-px">
              {visibleConversations.map((conversation: Conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={currentConversation?.id === conversation.id}
                  onClick={() => setCurrentConversation(conversation)}
                  onDelete={(event) => handleDeleteConversation(conversation.id, event)}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="h-10 min-h-[2.5rem] px-2">
          <div className="flex items-center justify-between h-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  isDeleting,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: (event: React.MouseEvent) => void;
  isDeleting: boolean;
}) {
  return (
    <SidebarMenuButton
      isActive={isActive}
      onClick={onClick}
      tooltip={formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
      className="px-2 py-1"
    >
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-sm">
          {conversation.title || 'New Chat'}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-5 w-5 opacity-0 group-hover:opacity-100',
          isActive && 'opacity-100'
        )}
        onClick={onDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </SidebarMenuButton>
  );
} 