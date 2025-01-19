import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Settings, Trash2, RefreshCcw } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, MessageSquarePlus } from 'lucide-react';

const MAX_RECENT_CONVERSATIONS = 5;

interface ConversationGroup {
  label: string;
  conversations: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
}

export function ConversationSidebar() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const {
    conversations,
    createConversation,
    deleteConversation,
    isCreating,
    clearAllConversations
  } = useChat();
  const [expandedDays, setExpandedDays] = useState<string[]>(['today']);
  const [showAllToday, setShowAllToday] = useState(false);

  const handleCreateConversation = useCallback(async () => {
    const conversation = await createConversation('New Chat');
    if (conversation) {
      navigate(`/chat/${conversation.id}`);
    }
  }, [createConversation, navigate]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    await deleteConversation(id);
    if (conversationId === id) {
      navigate('/chat');
    }
  }, [deleteConversation, conversationId, navigate]);

  const groupedConversations = useMemo(() => {
    const groups: Record<string, ConversationGroup> = {};

    conversations.forEach((conv) => {
      const date = parseISO(conv.created_at);
      let label: string;

      if (isToday(date)) {
        label = 'today';
      } else if (isYesterday(date)) {
        label = 'yesterday';
      } else {
        label = format(date, 'MMMM d, yyyy');
      }

      if (!groups[label]) {
        groups[label] = {
          label,
          conversations: [],
        };
      }

      groups[label].conversations.push(conv);
    });

    return Object.values(groups).sort((a, b) => {
      if (a.label === 'today') return -1;
      if (b.label === 'today') return 1;
      if (a.label === 'yesterday') return -1;
      if (b.label === 'yesterday') return 1;
      return new Date(b.conversations[0].created_at).getTime() - new Date(a.conversations[0].created_at).getTime();
    });
  }, [conversations]);

  return (
    <SidebarProvider defaultOpen>
      <Sidebar side="left" variant="floating" collapsible="icon" className="w-72">
        <SidebarHeader className="h-10 min-h-[2.5rem] px-2">
          <div className="flex items-center justify-between h-full">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCreateConversation}
              disabled={isCreating}
              className="h-7 w-7"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span className="sr-only">New Chat</span>
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <ScrollArea className="flex-1 px-2 py-2">
            {groupedConversations.map((group) => (
              <Collapsible
                key={group.label}
                defaultOpen={group.label === 'today'}
                open={expandedDays.includes(group.label)}
                onOpenChange={(isOpen) => {
                  setExpandedDays(prev =>
                    isOpen
                      ? [...prev, group.label]
                      : prev.filter(day => day !== group.label)
                  );
                }}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
                  <span className="capitalize">{group.label}</span>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    expandedDays.includes(group.label) && "rotate-90"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 px-1 py-2">
                  {(group.label === 'today' && !showAllToday
                    ? group.conversations.slice(0, MAX_RECENT_CONVERSATIONS)
                    : group.conversations
                  ).map((conv) => (
                    <div
                      key={conv.id}
                      className="group flex items-center gap-2"
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex-1 justify-start truncate",
                          conversationId === conv.id && "bg-sidebar-accent"
                        )}
                        onClick={() => navigate(`/chat/${conv.id}`)}
                      >
                        {conv.title || 'New Chat'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteConversation(conv.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {group.label === 'today' && group.conversations.length > MAX_RECENT_CONVERSATIONS && (
                    <Button
                      variant="ghost"
                      className="w-full text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground"
                      onClick={() => setShowAllToday(prev => !prev)}
                    >
                      {showAllToday ? 'Show Less' : `Show ${group.conversations.length - MAX_RECENT_CONVERSATIONS} More`}
                    </Button>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="h-10 min-h-[2.5rem] px-2">
          <div className="flex items-center justify-between h-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={clearAllConversations}
                >
                  <RefreshCcw className="h-4 w-4" />
                  <span className="sr-only">Clear All Chats</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear All Chats</TooltipContent>
            </Tooltip>
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