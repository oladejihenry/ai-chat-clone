"use client"
import {
  ChevronDown,
  X,
  ArrowUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { aiModels } from "@/lib/aimodels"
import { useChat, useSendMessage } from "@/hooks/use-chat"
import { useAuth } from "@/hooks/use-auth"
import { useConversationContext } from "@/components/providers/conversation-provider"
import React from "react"
import { toast } from "sonner"

export function Footer() {
  const [message, setMessage] = React.useState("")
  const [selectedModel, setSelectedModel] = React.useState(aiModels[0])
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { isAuthenticated } = useAuth()
  const { 
    createConversation, 
    isCreatingConversation 
  } = useChat()
  const sendMessageMutation = useSendMessage()
  const { 
    selectedConversationId, 
    setSelectedConversationId,
    currentConversationModel,
    setCurrentConversationModel,
    setIsSendingMessage
  } = useConversationContext()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return
    
    // Filter for supported file types (images and PDFs)
    const supportedFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isPDF = file.type === 'application/pdf'
      return isImage || isPDF
    })
    
    // Check file size (max 10MB per file)
    const validFiles = supportedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large (max 10MB)`)
        return false
      }
      return true
    })
    
    // Show feedback for rejected files
    const rejectedCount = files.length - validFiles.length
    if (rejectedCount > 0) {
      if (supportedFiles.length !== files.length) {
        toast.error('Some files were rejected. Only images and PDFs are supported.')
      }
      if (supportedFiles.length !== validFiles.length) {
        toast.error('Some files were too large. Maximum size is 10MB per file.')
      }
    }
    
    // Show success feedback for valid files
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} file${validFiles.length > 1 ? 's' : ''} uploaded successfully`)
    }
    
    setUploadedFiles((prev) => [...prev, ...validFiles])
    
    // Clear the input so the same file can be uploaded again
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !isAuthenticated) return

    const messageContent = message.trim()
    
    // If no conversation exists, create one first
    if (!selectedConversationId) {
      createConversation({
        modelName: selectedModel.name,
        modelProvider: selectedModel.provider,
        title: messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : ''),
      }, {
        onSuccess: (newConversation) => {
          setSelectedConversationId(newConversation.id)
          setCurrentConversationModel(`${selectedModel.name}-${selectedModel.provider}`)
          // Wait a bit for the conversation to be selected, then send the message
          setTimeout(() => {
            setIsSendingMessage(true)
            sendMessageMutation.mutate({
              conversationId: newConversation.id,
              content: messageContent,
              modelName: selectedModel.name,
              modelProvider: selectedModel.provider,
              files: uploadedFiles
            }, {
              onError: () => setIsSendingMessage(false),
              onSuccess: () => {
                setIsSendingMessage(false)
                setUploadedFiles([]) // Clear uploaded files after sending
              }
            })
          }, 100)
        },
        onError: (error) => {
          console.error('Failed to create conversation:', error)
        }
      })
    } else {
      // Send message to existing conversation with current model selection
      setIsSendingMessage(true)
      sendMessageMutation.mutate({
        conversationId: selectedConversationId,
        content: messageContent,
        modelName: selectedModel.name,
        modelProvider: selectedModel.provider,
        files: uploadedFiles
      }, {
        onError: (error) => {
          console.error('Failed to send message:', error)
          setIsSendingMessage(false)
        },
        onSuccess: () => {
          setIsSendingMessage(false)
          setUploadedFiles([]) // Clear uploaded files after sending
        }
      })
      
      // Update the current conversation model context
      setCurrentConversationModel(`${selectedModel.name}-${selectedModel.provider}`)
    }
    
    setMessage("")
    // Note: uploadedFiles are cleared in the success callbacks above
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const isLoading = isCreatingConversation || sendMessageMutation.isPending

  return (
    <footer className="p-6 ">
      <div className="max-w-4xl mx-auto">

        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {uploadedFiles.map((file, index) => {
              const isImage = file.type.startsWith('image/')
              const isPDF = file.type === 'application/pdf'
              
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-green-100 text-green-700 dark:bg-slate-800 dark:text-green-300 rounded-lg px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {isImage ? (
                      <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs">IMG</span>
                      </div>
                    ) : isPDF ? (
                      <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs">PDF</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs">FILE</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-32">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-green-200 hover:text-green-800 dark:hover:bg-slate-700 ml-2"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        <div className="relative">
          <div className="relative border border-green-200 dark:border-slate-700 rounded-lg bg-green-50/50 dark:bg-slate-800 focus-within:border-green-400 focus-within:ring-1 focus-within:ring-green-400">
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={!isAuthenticated || isLoading}
              className="min-h-[80px] resize-none border-0 bg-transparent focus:ring-0 focus:border-0 pr-16 pb-16 text-green-900 dark:text-white placeholder:text-gray-400"
            />

            {/* Bottom controls inside textarea */}
            <div className="absolute bottom-3 left-3 right-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!isAuthenticated}
                      className="h-8 px-2 text-xs text-green-800 dark:text-white hover:bg-green-100/20 dark:hover:bg-slate-700"
                    >
                      {selectedModel.name}
                      {selectedConversationId && currentConversationModel && 
                       currentConversationModel !== `${selectedModel.name}-${selectedModel.provider}` && 
                       <span className="ml-1 text-orange-500" title="Different model selected for this conversation">*</span>
                      }
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-64 bg-white dark:bg-slate-900 border-green-200 dark:border-slate-800 z-[100]"
                    side="top"
                    align="start"
                  >
                    {aiModels.map((model, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => setSelectedModel(model)}
                        className="flex flex-col items-start hover:bg-green-100 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-green-900 dark:text-green-100">{model.name}</span>
                          <Badge
                            variant="outline"
                            className="text-xs border-green-200 dark:border-slate-700 text-green-700 dark:text-green-300"
                          >
                            {model.category}
                          </Badge>
                        </div>
                        <span className="text-xs text-green-600 dark:text-green-400">{model.provider}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Send button */}
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!message.trim() || !isAuthenticated || isLoading}
              className="absolute right-3 bottom-3 bg-green-600 hover:bg-green-700 text-white rounded-full w-9 h-9 p-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </Button>
          </div>



          {!isAuthenticated && (
            <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
              Please sign in to start chatting
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf"
            title="Upload images or PDF files (max 10MB each)"
          />
        </div>
      </div>
    </footer>
  )
}