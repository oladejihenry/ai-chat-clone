const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface User {
  data: {
  id: number
  name: string
  email: string
  avatar?: string
  email_verified_at?: string
  created_at: string
  updated_at: string
  }
}

interface Message {
  id: string
  conversation_id: string
  content: string
  role: 'user' | 'assistant'
  model_name?: string
  created_at: string
  updated_at: string
}

interface Conversation {
  id: string
  user_id: number
  title: string
  model_name: string
  model_provider: string
  created_at: string
  updated_at: string
  messages?: Message[]
  last_message?: Message
  message_count?: number
}

interface ChatResponse {
  success: boolean
  data?: {
    conversation: Conversation
    message: Message
  }
  error?: string
}

interface ConversationResponse {
  success: boolean
  data?: Conversation[]
  error?: string
}

interface Usage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  prompt_tokens_details?: {
    cached_tokens: number
    audio_tokens: number
  }
  completion_tokens_details?: {
    reasoning_tokens: number
    audio_tokens: number
    accepted_prediction_tokens: number
    rejected_prediction_tokens: number
  }
}

// Initialize CSRF protection for Laravel Sanctum
export async function initializeCsrf(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`CSRF initialization failed: ${response.status}`)
    }
    
    // Wait a bit to ensure cookie is set
    await new Promise(resolve => setTimeout(resolve, 100))
  } catch (error) {
    console.error('Failed to initialize CSRF:', error)
    throw error
  }
}

// Get current authenticated user
export async function getCurrentUser(): Promise<User | null> {
  try {
    await initializeCsrf()
    
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return null // User is not authenticated
      }
      console.error('Get user failed:', response.status, response.statusText)
      throw new Error('Failed to fetch user')
    }

    const userData = await response.json()
    return userData
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
}

// Get CSRF token from cookies or meta tag
function getCsrfToken(): string | null {
  // Try to get from cookies first
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value)
    }
  }
  
  // Try to get from meta tag
  const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement
  return metaTag?.content || null
}

// Generic API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  await initializeCsrf()
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...options.headers as Record<string, string>,
  }
  
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const errorData = await response.text()
    console.error('API request failed:', response.status, response.statusText, errorData)
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

// Chat API functions
export async function createConversation(
  modelName: string,
  modelProvider: string,
  title?: string
): Promise<Conversation> {
  const response = await apiRequest<{ data: Conversation }>('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({
      model_name: modelName,
      model_provider: modelProvider,
      title: title || 'New Chat',
    }),
  })
  
  return response.data
}

export async function getConversations(): Promise<Conversation[]> {
  const response = await apiRequest<{ data: Conversation[] }>('/api/conversations')
  return response.data
}

export async function getConversation(id: string): Promise<Conversation> {
  const response = await apiRequest<{ data: Conversation }>(`/api/conversations/${id}`)
  return response.data
}

// Add this new function for streaming with real-time updates
export async function sendMessage(
  conversationId: string,
  content: string,
  modelName?: string,
  modelProvider?: string,
  files?: File[],
  onChunk?: (chunk: string) => void,
  onComplete?: (userMessage: Message, assistantMessage: Message) => void
): Promise<{ user_message: Message; assistant_message: Message }> {
  await initializeCsrf()
  
  const headers: Record<string, string> = {
    'Accept': 'text/event-stream',
    'X-Requested-With': 'XMLHttpRequest',
  }
  
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken
  }

  const formData = new FormData()
  formData.append('content', content)
  
  if (modelName && modelProvider) {
    formData.append('model_name', modelName)
    formData.append('model_provider', modelProvider)
  }

  if (files && files.length > 0) {
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file)
    })
  }
  
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  })
  
  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  
  return new Promise((resolve, reject) => {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let userMessage: Message | null = null
    let assistantMessage: Message | null = null
    
    if (!reader) {
      reject(new Error('No response body reader available'))
      return
    }

    function readStream() {
      reader?.read().then(({ done, value }) => {
        if (done) {
          if (userMessage && assistantMessage) {
            onComplete?.(userMessage, assistantMessage)
            resolve({ user_message: userMessage, assistant_message: assistantMessage })
          } else {
            reject(new Error('Stream completed without receiving both messages'))
          }
          return
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const event = line.slice(7)
            continue
          }
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                reject(new Error(data.error))
                return
              }
              
              // Handle streaming chunks
              if (data.content && onChunk) {
                onChunk(data.content)
              }
              
              // Handle completion event with both messages
              if (data.message && data.user_message) {
                userMessage = data.user_message
                assistantMessage = data.message
              }
            } catch (e) {
              // Ignore non-JSON lines
            }
          }
        }
        
        readStream()
      }).catch(reject)
    }
    
    readStream()
  })
}

export async function deleteConversation(id: string): Promise<void> {
  await apiRequest(`/api/conversations/${id}`, {
    method: 'DELETE',
  })
}

export async function updateConversationTitle(
  id: string,
  title: string
): Promise<Conversation> {
  const response = await apiRequest<{ data: Conversation }>(`/api/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
  
  return response.data
}

// Logout user
export async function logoutUser(): Promise<void> {
  try {
    // Initialize CSRF first
    await initializeCsrf()
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    }
    
    // Try to add CSRF token if available
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken
    }
    
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Logout failed:', response.status, response.statusText, errorData)
      throw new Error(`Failed to logout: ${response.status} ${response.statusText}`)
    }
  
  } catch (error) {
    console.error('Error logging out:', error)
    throw error
  }
}

export type { User, Message, Conversation, ChatResponse, ConversationResponse, Usage } 