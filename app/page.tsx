"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuthCallback } from "@/hooks/use-auth-callback"
import { useAuth } from "@/hooks/use-auth"
import { useConversation } from "@/hooks/use-chat"
import { useConversationContext } from "@/components/providers/conversation-provider"
import { categories } from "@/lib/categories"
import { MessageList } from "@/components/chat/message-list"
import { Brain } from "lucide-react"



export default function Home() {
  // Handle OAuth callback and refresh auth state
  useAuthCallback()
  
  const { isAuthenticated, user } = useAuth()

  const { selectedConversationId, setSelectedConversationId, isSendingMessage } = useConversationContext()

  const name = user?.data?.name || "Guest"
  

  const { 
    data: conversation, 
    isLoading: isLoadingConversation 
  } = useConversation(selectedConversationId)





    // If user has selected a conversation, show the chat interface
  if (selectedConversationId && conversation) {
    return (
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {conversation.title}
                </h2>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedConversationId(null)}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              New Chat
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-6">
            {isLoadingConversation ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-500">Loading conversation...</span>
                </div>
              </div>
            ) : conversation.messages?.length === 0 && !isSendingMessage ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Start a conversation with {conversation.model_name}
                </p>
              </div>
            ) : (
              <MessageList 
                messages={conversation.messages || []}
                isLoading={isSendingMessage}
              />
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

    // Default welcome screen
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-green-900 dark:text-white mb-8">
            How can I help you, <span className="capitalize">{name}</span>?
          </h1>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant="outline"
                className={`${category.color} border-green-200 dark:border-slate-700`}
                onClick={() => {
                  if (isAuthenticated) {
                    // Could implement category-based conversation creation
                  }
                }}
              >
                <category.icon className="w-4 h-4 mr-2" />
                {category.name}
              </Button>
            ))}
          </div>

          <div className="space-y-3 mb-16">
            <h1>Welcome to AI.chat, enter your question below to start chatting with AI models</h1>
          </div>

          {!isAuthenticated && (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">
                Please sign in to start chatting with AI models
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
