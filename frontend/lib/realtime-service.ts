import type { User, Message } from "@/types/messaging"

export interface MessageStatus {
  messageId: string
  status: "sending" | "sent" | "delivered" | "read"
  timestamp: Date
}

export type MessageStatusType = MessageStatus

export interface TypingIndicator {
  userId: string
  chatId: string
  isTyping: boolean
  timestamp: Date
}

export interface OnlineStatus {
  userId: string
  isOnline: boolean
  lastSeen: Date
}

type MessageListener = (message: Message) => void
type StatusListener = (status: MessageStatus) => void
type TypingListener = (typing: TypingIndicator) => void
type OnlineListener = (status: OnlineStatus) => void

/**
 * Simulated real-time messaging service
 * In a production app, this would use WebSockets or Server-Sent Events
 */
export class RealtimeMessagingService {
  private static instance: RealtimeMessagingService
  private messageListeners: MessageListener[] = []
  private statusListeners: StatusListener[] = []
  private typingListeners: TypingListener[] = []
  private onlineListeners: OnlineListener[] = []
  private currentUser: User | null = null
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map()

  static getInstance(): RealtimeMessagingService {
    if (!RealtimeMessagingService.instance) {
      RealtimeMessagingService.instance = new RealtimeMessagingService()
    }
    return RealtimeMessagingService.instance
  }

  setCurrentUser(user: User) {
    this.currentUser = user
    this.simulateOnlineStatus(user.id, true)
  }

  // Message listeners
  onMessage(listener: MessageListener) {
    this.messageListeners.push(listener)
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== listener)
    }
  }

  onMessageStatus(listener: StatusListener) {
    this.statusListeners.push(listener)
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener)
    }
  }

  onTyping(listener: TypingListener) {
    this.typingListeners.push(listener)
    return () => {
      this.typingListeners = this.typingListeners.filter((l) => l !== listener)
    }
  }

  onOnlineStatus(listener: OnlineListener) {
    this.onlineListeners.push(listener)
    return () => {
      this.onlineListeners = this.onlineListeners.filter((l) => l !== listener)
    }
  }

  // Send message with real-time status updates
  async sendMessage(message: Message): Promise<void> {
    // Immediately update status to "sending"
    this.notifyStatusListeners({
      messageId: message.id,
      status: "sending",
      timestamp: new Date(),
    })

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))

    // Update to "sent"
    this.notifyStatusListeners({
      messageId: message.id,
      status: "sent",
      timestamp: new Date(),
    })

    // Simulate message delivery to other participants
    setTimeout(
      () => {
        this.notifyStatusListeners({
          messageId: message.id,
          status: "delivered",
          timestamp: new Date(),
        })
      },
      1000 + Math.random() * 2000,
    )

    // Simulate read receipt (sometimes)
    if (Math.random() > 0.3) {
      setTimeout(
        () => {
          this.notifyStatusListeners({
            messageId: message.id,
            status: "read",
            timestamp: new Date(),
          })
        },
        3000 + Math.random() * 5000,
      )
    }
  }

  // Typing indicators
  startTyping(chatId: string) {
    if (!this.currentUser) return

    const typingIndicator: TypingIndicator = {
      userId: this.currentUser.id,
      chatId,
      isTyping: true,
      timestamp: new Date(),
    }

    // Clear existing timeout
    const timeoutKey = `${this.currentUser.id}-${chatId}`
    const existingTimeout = this.typingTimeouts.get(timeoutKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Notify listeners
    this.notifyTypingListeners(typingIndicator)

    // Auto-stop typing after 3 seconds
    const timeout = setTimeout(() => {
      this.stopTyping(chatId)
    }, 3000)
    this.typingTimeouts.set(timeoutKey, timeout)
  }

  stopTyping(chatId: string) {
    if (!this.currentUser) return

    const timeoutKey = `${this.currentUser.id}-${chatId}`
    const existingTimeout = this.typingTimeouts.get(timeoutKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      this.typingTimeouts.delete(timeoutKey)
    }

    const typingIndicator: TypingIndicator = {
      userId: this.currentUser.id,
      chatId,
      isTyping: false,
      timestamp: new Date(),
    }

    this.notifyTypingListeners(typingIndicator)
  }

  // Simulate receiving messages from other users
  simulateIncomingMessage(chatId: string, senderId: string, content: string, type: "text" | "voice" = "text") {
    if (this.currentUser && senderId === this.currentUser.id) return

    const message: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      chatId,
      senderId,
      content,
      type,
      timestamp: new Date(),
      isRedacted: Math.random() > 0.7, // 30% chance of having PII
      originalContent: content,
    }

    // Simulate network delay
    setTimeout(
      () => {
        this.notifyMessageListeners(message)
      },
      500 + Math.random() * 1500,
    )
  }

  // Simulate online status changes
  simulateOnlineStatus(userId: string, isOnline: boolean) {
    const status: OnlineStatus = {
      userId,
      isOnline,
      lastSeen: new Date(),
    }

    this.notifyOnlineListeners(status)
  }

  // Start simulating activity from other users
  startSimulation(chatId: string, otherUserIds: string[]) {
    // Simulate occasional incoming messages
    const messageInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        // 20% chance every 10 seconds
        const randomUserId = otherUserIds[Math.floor(Math.random() * otherUserIds.length)]
        const messages = [
          "Hey, how's it going?",
          "Did you see the news today?",
          "Let's catch up soon!",
          "Thanks for the info!",
          "That sounds great!",
        ]
        const randomMessage = messages[Math.floor(Math.random() * messages.length)]
        this.simulateIncomingMessage(chatId, randomUserId, randomMessage)
      }
    }, 10000)

    // Simulate typing indicators
    const typingInterval = setInterval(() => {
      if (Math.random() > 0.9) {
        // 10% chance every 5 seconds
        const randomUserId = otherUserIds[Math.floor(Math.random() * otherUserIds.length)]
        this.notifyTypingListeners({
          userId: randomUserId,
          chatId,
          isTyping: true,
          timestamp: new Date(),
        })

        // Stop typing after 2-4 seconds
        setTimeout(
          () => {
            this.notifyTypingListeners({
              userId: randomUserId,
              chatId,
              isTyping: false,
              timestamp: new Date(),
            })
          },
          2000 + Math.random() * 2000,
        )
      }
    }, 5000)

    // Simulate online status changes
    const onlineInterval = setInterval(() => {
      otherUserIds.forEach((userId) => {
        if (Math.random() > 0.95) {
          // 5% chance per user every 30 seconds
          const isOnline = Math.random() > 0.3 // 70% chance of being online
          this.simulateOnlineStatus(userId, isOnline)
        }
      })
    }, 30000)

    // Return cleanup function
    return () => {
      clearInterval(messageInterval)
      clearInterval(typingInterval)
      clearInterval(onlineInterval)
    }
  }

  private notifyMessageListeners(message: Message) {
    this.messageListeners.forEach((listener) => listener(message))
  }

  private notifyStatusListeners(status: MessageStatus) {
    this.statusListeners.forEach((listener) => listener(status))
  }

  private notifyTypingListeners(typing: TypingIndicator) {
    this.typingListeners.forEach((listener) => listener(typing))
  }

  private notifyOnlineListeners(status: OnlineStatus) {
    this.onlineListeners.forEach((listener) => listener(status))
  }
}

export const realtimeService = RealtimeMessagingService.getInstance()
