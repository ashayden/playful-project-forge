/**
 * AppSidebar component provides the main navigation sidebar for the chat application.
 * Features:
 * - List of conversations
 * - New chat creation
 * - Conversation deletion
 * - Active conversation highlighting
 */

import * as React from "react"
import { MessageSquare, Plus, Trash2 } from "lucide-react"
import { useChat } from "@/hooks/useChat"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { 
    conversations, 
    currentConversation, 
    createConversation, 
    setCurrentConversation, 
    deleteConversation, 
    isCreating, 
    isDeleting 
  } = useChat()

  return (
    <Sidebar {...props}>
      <SidebarHeader className="flex flex-row items-center justify-between p-4">
        <h2 className="text-lg font-semibold">Chats</h2>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => createConversation('New Chat')}
          disabled={isCreating}
          title="Create new chat"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Create new chat</span>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversations.map((chat) => (
                  <SidebarMenuItem key={chat.id} className="group">
                    <SidebarMenuButton
                      onClick={() => setCurrentConversation(chat)}
                      isActive={currentConversation?.id === chat.id}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span className="truncate">{chat.title || 'New Chat'}</span>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(chat.id)
                      }}
                      disabled={isDeleting}
                      title="Delete chat"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete chat</span>
                    </Button>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
