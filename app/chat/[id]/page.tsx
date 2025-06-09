import ChatComponent from "@/components/chatComponent"
import { Suspense } from "react"

interface ChatPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  // Handle OAuth callback and refresh auth state
  
  
  const conversationId = (await params).id

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatComponent conversationId={conversationId} />
    </Suspense>
  )
  
  
} 