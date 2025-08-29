import type { User, Chat, Message } from "@/types/messaging"

export const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    avatar: "/professional-male-avatar.png",
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    avatar: "/professional-female-avatar.png",
    isOnline: false,
    lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    avatar: "/casual-male-avatar.png",
    isOnline: true,
    lastSeen: new Date(),
  },
]

export const mockMessages: Message[] = [
  {
    id: "1",
    chatId: "1",
    senderId: "2",
    content: "Hey! How are you doing?",
    type: "text",
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    isRedacted: false,
  },
  {
    id: "2",
    chatId: "1",
    senderId: "1",
    content: "I'm good! My phone number is [REDACTED] if you need to call me.",
    type: "text",
    timestamp: new Date(Date.now() - 3000000), // 50 minutes ago
    isRedacted: true,
    originalContent: "I'm good! My phone number is 555-123-4567 if you need to call me.",
    redactedFields: ["phone_number"],
  },
]

export const mockChats: Chat[] = [
  {
    id: "1",
    participants: ["1", "2"],
    messages: mockMessages.filter((m) => m.chatId === "1"),
    lastMessage: mockMessages.find((m) => m.chatId === "1"),
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 3000000),
    isGroup: false,
  },
  {
    id: "2",
    name: "Work Group",
    participants: ["1", "2", "3"],
    messages: [],
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000),
    isGroup: true,
  },
]
