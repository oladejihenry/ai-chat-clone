"use client"

import React, { createContext, useContext, useState } from 'react'

interface ConversationContextType {
  selectedConversationId: number | null
  setSelectedConversationId: (id: number | null) => void
  currentConversationModel: string | null
  setCurrentConversationModel: (model: string | null) => void
  isSendingMessage: boolean
  setIsSendingMessage: (loading: boolean) => void
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [currentConversationModel, setCurrentConversationModel] = useState<string | null>(null)
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  return (
    <ConversationContext.Provider 
      value={{ 
        selectedConversationId, 
        setSelectedConversationId,
        currentConversationModel,
        setCurrentConversationModel,
        isSendingMessage,
        setIsSendingMessage
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