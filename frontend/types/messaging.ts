export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  isOnline: boolean
  lastSeen: Date
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  type: "text" | "voice"
  timestamp: Date
  isRedacted: boolean
  originalContent?: string
  redactedFields?: string[]
}

export interface Chat {
  id: string
  name?: string
  participants: string[]
  messages: Message[]
  lastMessage?: Message
  createdAt: Date
  updatedAt: Date
  isGroup: boolean
}

export interface PIIDetectionResult {
  hasRedactions: boolean
  redactedContent: string
  detectedFields: string[]
  originalContent: string
  detectionDetails?: Array<{
    type: string
    original: string
    confidence: number
    position: [number, number]
  }>
  messageType?: "text" | "voice"
  transcriptionConfidence?: number
}

export interface PIIAnalytics {
  totalMessages: number
  messagesWithPII: number
  piiTypes: Record<string, number>
  redactionRate: number
  lastUpdated: Date
}
