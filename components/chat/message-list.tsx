"use client"

import { useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Copy, 
} from 'lucide-react'
import { type Message } from '@/lib/api'
import { TypingIndicator } from './typing-indicator'
import { cn } from '@/lib/utils'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
}

export function MessageList({ messages,  isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-4",
            message.role === 'user' ? "flex-row-reverse" : "flex-row"
          )}
        >

          {/* Message Content */}
          <div className={cn(
            "flex-1 max-w-[80%]",
            message.role === 'user' ? "text-right" : "text-left"
          )}>
            <div className={cn(
              "inline-block px-4 py-3 rounded-2xl",
              message.role === 'user'
                ? "bg-green-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            )}>
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            </div>

            {/* Message Meta */}
            <div className={cn(
              "flex items-center gap-2 mt-2 text-xs text-gray-500",
              message.role === 'user' ? "justify-end" : "justify-start"
            )}>
              <span>{formatTime(message.created_at)}</span>
              {message.model_name && (
                <Badge variant="outline" className="text-xs">
                  {message.model_name}
                </Badge>
              )}
            </div>

            {/* Assistant Message Actions */}
            {message.role === 'assistant' && (
              <div className="flex items-center gap-1 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => copyToClipboard(message.content)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && <TypingIndicator />}
      
      {/* Invisible div to scroll to */}
      <div ref={messagesEndRef} />
    </div>
  )
} 