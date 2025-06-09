"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { 
  MessageSquare, 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  Loader2,
  Sparkle
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { useConversations, useChat } from '@/hooks/use-chat'
import { useAuth } from '@/hooks/use-auth'
import { type Conversation } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ScrollArea } from '../ui/scroll-area'

interface ConversationListProps {
  selectedConversationId?: string | null
  onConversationSelect: (conversationId: string) => void
  onNewConversation: () => void
}

export function ConversationList({ 
  selectedConversationId, 
  onConversationSelect,
  onNewConversation 
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  
  const { isAuthenticated } = useAuth()
  const { data: conversations, isLoading } = useConversations()
  const { deleteConversation, updateTitle, isDeletingConversation } = useChat()
  
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
  
  const handleDelete = (conversationId: string) => {
    deleteConversation(conversationId)
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }
  
  const getModelIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return '🤖'
      case 'anthropic': return '🧠'
      case 'google': return '🔍'
      case 'meta': return '🦙'
      case 'mistral': return '🌟'
      default: return '🤖'
    }
  }
  
  if (!isAuthenticated) {
    return (
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Sign in to view conversations</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Conversations</h2>
          <Button
            size="sm"
            onClick={onNewConversation}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : conversations?.length === 0 ? (
            
            <div className="text-center py-8 px-4">
              <Sparkle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <p className="text-gray-400 text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations?.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative p-3 rounded-lg cursor-pointer transition-colors",
                    selectedConversationId === conversation.id
                      ? "bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-lg mt-0.5">
                      {getModelIcon(conversation.model_provider)}
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
                          className="w-full text-sm font-medium bg-transparent border-none outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.title}
                        </h3>
                      )}
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {conversation.model_name}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(conversation.updated_at)}
                        </span>
                      </div>
                      
                      {conversation.last_message && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                          {conversation.last_message.content}
                        </p>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditStart(conversation)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(conversation.id)}
                          className="text-red-600 dark:text-red-400"
                          disabled={isDeletingConversation}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 