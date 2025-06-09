"use client"

import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Copy, 
  Check 
} from 'lucide-react'
import { type Message } from '@/lib/api'
import { TypingIndicator } from './typing-indicator'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
}

export function MessageList({ messages,  isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [copiedCodeBlock, setCopiedCodeBlock] = useState<string | null>(null)

  const copyToClipboard = async (content: string, messageId?: string, isCodeBlock?: boolean) => {
    try {
      await navigator.clipboard.writeText(content)
      
      if (isCodeBlock) {
        setCopiedCodeBlock(messageId || 'code')
        setTimeout(() => setCopiedCodeBlock(null), 2000)
      } else {
        setCopiedMessageId(messageId || 'message')
        setTimeout(() => setCopiedMessageId(null), 2000)
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  // Custom code block component with copy functionality
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CodeBlock = (props: any) => {
    const { inline, className, children } = props
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''
    const codeString = String(children).replace(/\n$/, '')
    const codeId = `code-${Math.random().toString(36).substr(2, 9)}`

    if (!inline && language) {
      return (
        <div className="relative group my-4 w-full overflow-hidden rounded-lg">
          <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg min-w-0">
            <span className="text-sm text-gray-300 font-medium truncate">{language}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              onClick={() => copyToClipboard(codeString, codeId, true)}
            >
              {copiedCodeBlock === codeId ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
          <div className="relative overflow-hidden">
            <SyntaxHighlighter
              language={language}
              style={oneDark}
              customStyle={{
                margin: 0,
                padding: '16px',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.5',
                overflow: 'auto',
                maxWidth: '100%',
                width: '100%',
                wordBreak: 'break-all',
                whiteSpace: 'pre-wrap',
              }}
              wrapLongLines={true}
              showLineNumbers={false}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        </div>
      )
    }

    return (
      <code 
        className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono break-all max-w-full inline-block"
      >
        {children}
      </code>
    )
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
    <div className="space-y-6 w-full overflow-hidden">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-4 w-full",
            message.role === 'user' ? "flex-row-reverse" : "flex-row"
          )}
        >

          {/* Message Content */}
          <div className={cn(
            "flex-1 max-w-[80%] min-w-0", // min-w-0 is crucial for proper flex shrinking
            message.role === 'user' ? "text-right" : "text-left"
          )}>
            <div className={cn(
              "inline-block px-4 py-3 rounded-2xl max-w-full overflow-hidden",
              message.role === 'user'
                ? "bg-green-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            )}>
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:p-0 prose-pre:bg-transparent overflow-hidden">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: CodeBlock,
                      pre: ({ children }) => <div className="overflow-hidden">{children}</div>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words overflow-hidden">
                  {message.content}
                </div>
              )}
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
                  onClick={() => copyToClipboard(message.content, message.id.toString())}
                >
                  {copiedMessageId === message.id.toString() ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
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