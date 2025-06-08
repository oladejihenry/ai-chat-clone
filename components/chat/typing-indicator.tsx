"use client"

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bot } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex gap-4">
      <Avatar className="w-8 h-8 mt-1">
        <AvatarFallback className="bg-blue-100 text-blue-700">
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="inline-block px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          AI is thinking...
        </div>
      </div>
    </div>
  )
} 