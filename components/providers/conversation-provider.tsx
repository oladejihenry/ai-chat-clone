"use client"

import React, { createContext, useContext, useState } from 'react'

interface ConversationContextType {
  selectedConversationId: string | null
  setSelectedConversationId: (id: string | null) => void
  currentConversationModel: string | null
  setCurrentConversationModel: (model: string | null) => void
  isSendingMessage: boolean
  setIsSendingMessage: (loading: boolean) => void
  clearSelection: () => void
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [currentConversationModel, setCurrentConversationModel] = useState<string | null>(null)
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  const clearSelection = () => {
    setSelectedConversationId(null)
    setCurrentConversationModel(null)
    setIsSendingMessage(false)
  }

  // Enhanced setSelectedConversationId that validates the ID
  const setSelectedConversationIdSafe = (id: string | null) => {
    // If setting to null, always allow
    if (id === null) {
      setSelectedConversationId(null)
      return
    }
    
    // Validate that the ID is a proper string (not empty, etc.)
    if (typeof id === 'string' && id.trim().length > 0) {
      setSelectedConversationId(id)
    } else {
      console.warn('Invalid conversation ID provided:', id)
      setSelectedConversationId(null)
    }
  }

  return (
    <ConversationContext.Provider 
      value={{ 
        selectedConversationId, 
        setSelectedConversationId: setSelectedConversationIdSafe,
        currentConversationModel,
        setCurrentConversationModel,
        isSendingMessage,
        setIsSendingMessage,
        clearSelection
      }}
    >
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversationContext() {
  const context = useContext(ConversationContext)
  if (context === undefined) {
    throw new Error('useConversationContext must be used within a ConversationProvider')
  }
  return context
} 