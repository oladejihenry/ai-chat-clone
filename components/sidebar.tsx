"use client"
import {
  Search,
  LogIn,
  Moon,
  Sun,
  MessageSquare,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useTheme } from "next-themes"
import React, { useState } from "react"
import { GoogleLogin } from "./googleLogin"
import { UserMenu } from "./user-menu"
import { useAuth } from "@/hooks/use-auth"
import { useConversations, useChat } from "@/hooks/use-chat"
import { useQueryClient } from "@tanstack/react-query"
import { useConversationContext } from "@/components/providers/conversation-provider"
import { type Conversation } from "@/lib/api"
import { cn } from "@/lib/utils"

export function SidebarComponent() {
    const [loginOpen, setLoginOpen] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingTitle, setEditingTitle] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const { isAuthenticated, isLoading } = useAuth()
    const { data: conversations, isLoading: isLoadingConversations } = useConversations()
    const { deleteConversation, updateTitle, isDeletingConversation } = useChat()
    const { selectedConversationId, setSelectedConversationId, setCurrentConversationModel, clearSelection } = useConversationContext()
    const queryClient = useQueryClient()

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const handleEditStart = (conversation: Conversation) => {
      setEditingId(conversation.id)
      setEditingTitle(conversation.title)
    }
    
    const handleEditSave = () => {
      if (editingId && editingTitle.trim()) {
        updateTitle({ id: editingId, title: editingTitle.trim() })
        setEditingId(null)
        setEditingTitle('')
      }
    }
    
    const handleEditCancel = () => {
      setEditingId(null)
      setEditingTitle('')
    }
    
    const handleDelete = async (conversationId: string) => {
      // Immediately cancel any ongoing queries for this conversation
      await queryClient.cancelQueries({ queryKey: ['conversation', conversationId] })
      queryClient.removeQueries({ queryKey: ['conversation', conversationId] })
      
      // If we're deleting the currently selected conversation, clear the selection FIRST
      if (selectedConversationId === conversationId) {
        clearSelection()
        // Small delay to ensure state is updated before navigation
        await new Promise(resolve => setTimeout(resolve, 50))
        router.push('/')
      }
      
      // Then delete the conversation
      deleteConversation(conversationId)
    }

    const filteredConversations = conversations?.filter(conversation =>
      conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.model_name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    // Group conversations by date
    const groupConversationsByDate = (conversations: Conversation[]) => {
      const groups: { [key: string]: Conversation[] } = {}
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000))
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      conversations.forEach(conversation => {
        const conversationDate = new Date(conversation.updated_at)
        const conversationDay = new Date(conversationDate.getFullYear(), conversationDate.getMonth(), conversationDate.getDate())

        let groupKey: string
        if (conversationDay.getTime() === today.getTime()) {
          groupKey = 'Today'
        } else if (conversationDay.getTime() === yesterday.getTime()) {
          groupKey = 'Yesterday'
        } else if (conversationDate >= thisWeekStart) {
          groupKey = 'This Week'
        } else if (conversationDate >= thisMonthStart) {
          groupKey = 'This Month'
        } else {
          const monthName = conversationDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          groupKey = monthName
        }

        if (!groups[groupKey]) {
          groups[groupKey] = []
        }
        groups[groupKey].push(conversation)
      })

      // Sort conversations within each group by updated_at (newest first)
      Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      })

      return groups
    }

    const groupedConversations = groupConversationsByDate(filteredConversations)

    // Define the order for date groups
    const getGroupOrder = (groupKey: string): number => {
      switch (groupKey) {
        case 'Today': return 1
        case 'Yesterday': return 2
        case 'This Week': return 3
        case 'This Month': return 4
        default: return 5 // For monthly groups
      }
    }

    // Sort the groups by their logical order
    const sortedGroupEntries = Object.entries(groupedConversations).sort(([a], [b]) => {
      const orderA = getGroupOrder(a)
      const orderB = getGroupOrder(b)
      
      if (orderA !== orderB) {
        return orderA - orderB
      }
      
      // For monthly groups, sort by date (newest first)
      if (orderA === 5 && orderB === 5) {
        return b.localeCompare(a)
      }
      
      return 0
    })

    return (
        <Sidebar className="border-r border-green-200 bg-green-50/80 dark:bg-slate-900 dark:border-slate-800">
            <SidebarHeader className="p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                    <span className="text-white text-sm font-bold">AI</span>
                </div>
                <span className="font-semibold text-green-900 dark:text-white">AI.chat</span>
                </div>
                <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-green-700 hover:bg-green-100 dark:text-white dark:hover:bg-slate-800"
                >
                {mounted ? (
                    theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
                ) : (
                    <Moon className="w-4 h-4" />
                )}
                </Button>
            </div>
                         <Button 
               className="w-full bg-green-600 hover:bg-green-700 text-white"
               onClick={() => {
                 clearSelection()
                 router.push('/')
               }}
               disabled={!isAuthenticated}
             >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
            </SidebarHeader>

            <SidebarContent className="px-4">
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 dark:text-green-400 w-4 h-4" />
                <Input
                placeholder="Search your threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-800 border-green-200 dark:border-slate-700 focus:border-green-400 focus:ring-green-400 dark:focus:border-green-500 dark:focus:ring-green-500"
                />
            </div>

            {/* Conversations List */}
            {isAuthenticated && (
              <div className="space-y-1">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8 px-2">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 text-xs">
                      {conversations?.length === 0 ? 'No conversations yet' : 'No matching conversations'}
                    </p>
                  </div>
                ) : (
                  sortedGroupEntries.map(([dateGroup, groupConversations]) => (
                    <div key={dateGroup} className="space-y-1">
                      {/* Date Section Header */}
                      <div className="sticky top-0 bg-green-50/80 dark:bg-slate-900 px-1 py-2 z-10">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {dateGroup}
                        </h3>
                      </div>
                      
                      {/* Conversations in this date group */}
                      <div className="space-y-1">
                        {groupConversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            className={cn(
                              "group relative p-2 rounded-lg cursor-pointer transition-colors",
                              selectedConversationId === conversation.id
                                ? "bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                : "hover:bg-green-100/50 dark:hover:bg-slate-800"
                            )}
                            onClick={() => {
                              setSelectedConversationId(conversation.id)
                              setCurrentConversationModel(`${conversation.model_name}-${conversation.model_provider}`)
                              router.push(`/chat/${conversation.id}`)
                            }}
                          >
                            <div className="flex items-start space-x-2">
                              <div className="text-sm mt-0.5">
                                {/* {getModelIcon(conversation.model_provider)} */}
                              </div>
                              <div className="flex-1 min-w-0">
                                {editingId === conversation.id ? (
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onBlur={handleEditSave}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleEditSave()
                                      if (e.key === 'Escape') handleEditCancel()
                                    }}
                                    className="w-full text-xs font-medium bg-transparent border-none outline-none"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <h4 className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                    {conversation.title}
                                  </h4>
                                )}
                                
                                {conversation.last_message && (
                                  <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1 truncate">
                                    {conversation.last_message.content}
                                  </p>
                                )}
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 h-5 w-5 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditStart(conversation)}>
                                    <Edit className="w-3 h-3 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(conversation.id)}
                                    className="text-red-600 dark:text-red-400"
                                    disabled={isDeletingConversation}
                                  >
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            </SidebarContent>

            <SidebarFooter className="p-4">
                {isLoading ? (
                    <div className="w-full h-10 bg-green-100 dark:bg-slate-800 rounded animate-pulse" />
                ) : isAuthenticated ? (
                    <UserMenu />
                ) : (
                    <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-green-700 hover:bg-green-100 dark:text-white dark:hover:bg-slate-800"
                            >
                                <LogIn className="w-4 h-4 mr-2" />
                                Login
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-green-200 dark:border-slate-800">
                            <DialogHeader>
                                <DialogTitle className="text-green-900 dark:text-green-100">Login to AI.chat</DialogTitle>
                            </DialogHeader>
                            <GoogleLogin />
                        </DialogContent>
                    </Dialog>
                )}
            </SidebarFooter>
        </Sidebar>
    )
}