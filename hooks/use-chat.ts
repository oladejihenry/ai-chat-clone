import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  deleteConversation,
  updateConversationTitle,
  type Conversation,
  type Message,
} from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from './use-auth'

export function useConversations() {
  const { isAuthenticated, user } = useAuth()
  
  return useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    enabled: isAuthenticated && !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useConversation(id: string | null) {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => {
      if (!id) throw new Error('No conversation ID provided')
      return getConversation(id)
    },
    enabled: isAuthenticated && !!id,
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry 404 errors - conversation doesn't exist
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        return false
      }
      // Don't retry if conversation ID is invalid
      if (error.message.includes('No conversation ID provided')) {
        return false
      }
      // Retry other errors up to 3 times
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Add error handling to prevent background refetches
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({
      modelName,
      modelProvider,
      title,
    }: {
      modelName: string
      modelProvider: string
      title?: string
    }) => createConversation(modelName, modelProvider, title),
    onSuccess: (newConversation) => {
      // Add the new conversation to the list
      queryClient.setQueryData(['conversations'], (old: Conversation[] | undefined) => {
        return [newConversation, ...(old || [])]
      })
      
      // Cache the new conversation details
      queryClient.setQueryData(['conversation', newConversation.id], newConversation)
      
      toast.success('New conversation created')
    },
    onError: (error) => {
      console.error('Failed to create conversation:', error)
      toast.error('Failed to create conversation')
    },
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({
      conversationId,
      content,
      modelName,
      modelProvider,
    }: {
      conversationId: string
      content: string
      modelName?: string
      modelProvider?: string
    }) => sendMessage(conversationId, content, modelName, modelProvider),
    onMutate: async ({ conversationId, content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['conversation', conversationId] })
      
      // Snapshot the previous value
      const previousConversation = queryClient.getQueryData(['conversation', conversationId])
      
      // Create optimistic user message with special ID
      const optimisticId = `temp-${Date.now()}`
      
      // Optimistically update the conversation with user message
      queryClient.setQueryData(['conversation', conversationId], (old: Conversation | undefined) => {
        if (!old) return old
        
        const optimisticUserMessage: Message = {
          id: optimisticId, // Temporary ID
          conversation_id: conversationId,
          content,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        
        return {
          ...old,
          messages: [...(old.messages || []), optimisticUserMessage],
          updated_at: new Date().toISOString()
        }
      })
      
      return { previousConversation, optimisticId }
    },
    onSuccess: (response, { conversationId }) => {
      const { user_message, assistant_message } = response
      
      // Update the conversation with both messages
      queryClient.setQueryData(['conversation', conversationId], (old: Conversation | undefined) => {
        if (!old) return old
        
        // Remove the optimistic user message and add the real messages
        const existingMessages = old.messages || []
        const messagesWithoutOptimistic = existingMessages.filter(msg => {
          const msgId = msg.id.toString()
          return !msgId.startsWith('temp-')
        })
        const updatedMessages = [...messagesWithoutOptimistic, user_message, assistant_message]
        
        return {
          ...old,
          messages: updatedMessages,
          updated_at: assistant_message.updated_at
        }
      })
      
      // Update the conversations list to reflect the latest message
      queryClient.setQueryData(['conversations'], (old: Conversation[] | undefined) => {
        if (!old) return old
        return old.map((conv) =>
          conv.id === conversationId
            ? { 
                ...conv, 
                last_message: assistant_message, 
                updated_at: assistant_message.updated_at
              }
            : conv
        )
      })
    },
    onError: (error, { conversationId }, context) => {
      // Revert the optimistic update
      if (context?.previousConversation) {
        queryClient.setQueryData(['conversation', conversationId], context.previousConversation)
      }
      
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      // Cancel and remove all queries for this conversation BEFORE making the API call
      await queryClient.cancelQueries({ queryKey: ['conversation', conversationId] })
      queryClient.removeQueries({ queryKey: ['conversation', conversationId] })
      
      // Now make the actual delete API call
      return deleteConversation(conversationId)
    },
    onMutate: async (conversationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['conversations'] })
      await queryClient.cancelQueries({ queryKey: ['conversation', conversationId] })
      
      // Snapshot the previous value
      const previousConversations = queryClient.getQueryData(['conversations'])
      
      // Optimistically update the conversations list
      queryClient.setQueryData(['conversations'], (old: Conversation[] | undefined) => {
        return old?.filter((conv) => conv.id !== conversationId) || []
      })
      
      // Remove the conversation from cache immediately
      queryClient.removeQueries({ queryKey: ['conversation', conversationId] })
      queryClient.setQueryData(['conversation', conversationId], undefined)
      
      return { previousConversations }
    },
    onSuccess: (_, conversationId) => {
      // Ensure the conversation is completely removed from cache
      queryClient.removeQueries({ queryKey: ['conversation', conversationId] })
      queryClient.setQueryData(['conversation', conversationId], undefined)
      toast.success('Conversation deleted')
    },
    onError: (error, _, context) => {
      // Revert the optimistic update
      if (context?.previousConversations) {
        queryClient.setQueryData(['conversations'], context.previousConversations)
      }
      
      console.error('Failed to delete conversation:', error)
      toast.error('Failed to delete conversation')
    },
  })
}

export function useUpdateConversationTitle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateConversationTitle(id, title),
    onSuccess: (updatedConversation) => {
      // Update the conversation in cache
      queryClient.setQueryData(['conversation', updatedConversation.id], updatedConversation)
      
      // Update the conversations list
      queryClient.setQueryData(['conversations'], (old: Conversation[] | undefined) => {
        if (!old) return old
        return old.map((conv) =>
          conv.id === updatedConversation.id ? updatedConversation : conv
        )
      })
      
      toast.success('Conversation title updated')
    },
    onError: (error) => {
      console.error('Failed to update conversation title:', error)
      toast.error('Failed to update conversation title')
    },
  })
}

// Helper hook for managing chat state
export function useChat() {
  const createConversationMutation = useCreateConversation()
  const sendMessageMutation = useSendMessage()
  const deleteConversationMutation = useDeleteConversation()
  const updateTitleMutation = useUpdateConversationTitle()
  
  return {
    createConversation: createConversationMutation.mutate,
    sendMessage: sendMessageMutation.mutate,
    deleteConversation: deleteConversationMutation.mutate,
    updateTitle: updateTitleMutation.mutate,
    
    isCreatingConversation: createConversationMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
    isDeletingConversation: deleteConversationMutation.isPending,
    isUpdatingTitle: updateTitleMutation.isPending,
  }
} 