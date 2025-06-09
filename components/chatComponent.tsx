"use client"

import { Button } from "./ui/button"
import { useConversation } from "@/hooks/use-chat"
import { useConversationContext } from "@/components/providers/conversation-provider"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { ScrollArea } from "./ui/scroll-area"
import { MessageList } from "./chat/message-list"
import { Brain } from "lucide-react"
import React from "react"

export default function ChatComponent({ conversationId }: { conversationId: string }) {
  
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { setSelectedConversationId, isSendingMessage, clearSelection } = useConversationContext()
  const { 
    data: conversation, 
    isLoading: isLoadingConversation,
    error 
  } = useConversation(conversationId)

  // Update context when conversation loads
  React.useEffect(() => {
    if (conversationId && conversationId.trim() !== '') {
      setSelectedConversationId(conversationId)
    }
  }, [conversationId, setSelectedConversationId])

  // Clear selected conversation and redirect on 404 error
  React.useEffect(() => {
    if (error) {
      // Check if it's a 404 error (conversation not found)
      const is404 = error.message.includes('404') || error.message.includes('Not Found')
      if (is404) {
        console.log('Conversation not found, clearing selection and redirecting to home')
        clearSelection()
        router.push('/')
        return
      }
    }
  }, [error, setSelectedConversationId, router, clearSelection])

  // Redirect to home if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // Handle conversation not found or invalid ID
  if (error || !conversationId || conversationId.trim() === '') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Conversation Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The conversation you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button
            onClick={() => {
              clearSelection()
              router.push('/')
            }}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoadingConversation) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-500">Loading conversation...</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              New Chat
            </Button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500">Loading conversation...</span>
          </div>
        </div>
      </div>
    )
  }

  // Conversation found and loaded
  if (conversation) {
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
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-6">
            {conversation.messages?.length === 0 && !isSendingMessage ? (
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

  // Fallback - should not reach here
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        <Button
          onClick={() => {
            clearSelection()
            router.push('/')
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Go Home
        </Button>
      </div>
    </div>
  )
}
