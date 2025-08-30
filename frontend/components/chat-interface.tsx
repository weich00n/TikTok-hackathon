"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Send, Mic, Phone, Video, MoreVertical, Shield, History } from "lucide-react"
import type { User, Chat } from "@/types/messaging"
import { formatDistanceToNow, format } from "date-fns"
import { VoiceRecorder } from "@/components/voice-recorder"
import { VoiceMessage } from "@/components/voice-message"
import { TypingIndicator } from "@/components/typing-indicator"
import { MessageStatus } from "@/components/message-status"
import { MessageHistoryPanel } from "@/components/message-history-panel"
import type { MessageStatus as MessageStatusType } from "@/lib/realtime-service"

interface ChatInterfaceProps {
  chat: Chat
  currentUser: User
  users: User[]
  onSendMessage: (content: string, type?: "text" | "voice") => void
  onTyping: (isTyping: boolean) => void
  messageStatuses: Map<string, MessageStatusType>
  typingUsers: string[]
}

export function ChatInterface({
  chat,
  currentUser,
  users,
  onSendMessage,
  onTyping,
  messageStatuses,
  typingUsers,
}: ChatInterfaceProps) {
  const [messageInput, setMessageInput] = useState("")
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const getOtherParticipant = (): User | null => {
    if (chat.isGroup) return null
    const otherUserId = chat.participants.find((id) => id !== currentUser.id)
    return users.find((user) => user.id === otherUserId) || null
  }

  const getChatName = (): string => {
    if (chat.isGroup && chat.name) return chat.name
    const otherUser = getOtherParticipant()
    return otherUser?.name || "Unknown User"
  }

  const getChatAvatar = (): string => {
    if (chat.isGroup) return "/group-avatar.png"
    const otherUser = getOtherParticipant()
    return otherUser?.avatar || "/professional-male-avatar.png"
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessageInput(value)

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      onTyping(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      onTyping(false)
    }, 1000)
  }

  const handleSendTextMessage = async () => {
    if (!messageInput.trim()) return

    onSendMessage(messageInput.trim(), "text")
    setMessageInput("")

    // Stop typing indicator
    setIsTyping(false)
    onTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendTextMessage()
    }
  }

  const handleSendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    setIsProcessingVoice(true)
    setShowVoiceRecorder(false)

    try {
      // Simulate voice processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock transcription with PII
      const mockTranscripts = [
        "Hi, this is a voice message. My number is 555-123-4567 if you need to reach me.",
        "Hey, can you send the documents to john.doe@company.com?",
        "The meeting is at 456 Oak Avenue. You can call me at (555) 234-5678.",
        "Thanks for the update! Talk to you soon.",
        "Let me know when you're free to chat.",
      ]

      const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
      onSendMessage(transcript, "voice")
    } catch (error) {
      console.error("Voice processing failed:", error)
    } finally {
      setIsProcessingVoice(false)
    }
  }

  const handleCancelVoiceRecording = () => {
    setShowVoiceRecorder(false)
  }

  const handleJumpToMessage = (messageId: string) => {
    // In a real implementation, this would scroll to the specific message
    console.log("Jumping to message:", messageId)
    // For now, just scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat.messages])

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const otherUser = getOtherParticipant()
  const typingUserObjects = users.filter((user) => typingUsers.includes(user.id) && user.id !== currentUser.id)

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col bg-background">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={getChatAvatar() || "/placeholder.svg"} alt={getChatName()} />
                <AvatarFallback>{getChatName().charAt(0)}</AvatarFallback>
              </Avatar>
              {!chat.isGroup && otherUser?.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold">{getChatName()}</h2>
              <p className="text-sm text-muted-foreground">
                {chat.isGroup
                  ? `${chat.participants.length} participants`
                  : otherUser?.isOnline
                    ? "Online"
                    : `Last seen ${otherUser?.lastSeen ? formatDistanceToNow(otherUser.lastSeen, { addSuffix: true }) : "unknown"}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Shield className="w-4 h-4 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>PII Protection Active</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => setShowHistoryPanel(!showHistoryPanel)}>
                    <History className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Message History</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {chat.messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              chat.messages.map((message, index) => {
                const isOwnMessage = message.senderId === currentUser.id
                const sender = users.find((u) => u.id === message.senderId)
                const showAvatar =
                  !isOwnMessage && (index === 0 || chat.messages[index - 1].senderId !== message.senderId)
                const messageStatus = messageStatuses.get(message.id)

                return (
                  <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} space-x-2`}>
                    {!isOwnMessage && (
                      <div className="w-8">
                        {showAvatar && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={sender?.avatar || "/placeholder.svg"} alt={sender?.name || "User"} />
                            <AvatarFallback>{sender?.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? "order-1" : ""}`}>
                      {message.type === "voice" ? (
                        <VoiceMessage message={message} isOwnMessage={isOwnMessage} />
                      ) : (
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <p className="text-sm break-words">{message.content}</p>

                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs opacity-70">{format(message.timestamp, "HH:mm")}</span>
                            <div className="flex items-center space-x-1">
                              {message.isRedacted && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="text-xs">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Protected
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Personal information was automatically redacted</p>
                                      {message.redactedFields && (
                                        <p className="text-xs">Detected: {message.redactedFields.join(", ")}</p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {isOwnMessage && messageStatus && (
                                <MessageStatus status={messageStatus.status} timestamp={messageStatus.timestamp} />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}

            {/* Typing Indicator */}
            {typingUserObjects.length > 0 && <TypingIndicator users={typingUserObjects} />}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Voice Recorder */}
        {showVoiceRecorder && (
          <div className="p-4 border-t border-border">
            <VoiceRecorder
              onSendVoiceMessage={handleSendVoiceMessage}
              onCancel={handleCancelVoiceRecording}
              isProcessing={isProcessingVoice}
            />
          </div>
        )}

        {/* Message Input */}
        {!showVoiceRecorder && (
          <div className="p-4 border-t border-border bg-card">
            {isProcessingVoice && (
              <div className="mb-2 p-2 bg-muted rounded-lg text-sm text-muted-foreground">
                Processing voice message and scanning for PII...
              </div>
            )}

            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={isProcessingVoice}
                  className="resize-none"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVoiceRecorder(true)}
                disabled={isProcessingVoice}
                className="shrink-0"
              >
                <Mic className="w-4 h-4" />
              </Button>

              <Button
                onClick={handleSendTextMessage}
                disabled={!messageInput.trim() || isProcessingVoice}
                size="sm"
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-2 flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              Messages are automatically scanned and personal information is protected
            </p>
          </div>
        )}
      </div>

      {/* Message History Panel */}
      {showHistoryPanel && (
        <div className="w-96">
          <MessageHistoryPanel
            chat={chat}
            users={users}
            currentUser={currentUser}
            onClose={() => setShowHistoryPanel(false)}
            onJumpToMessage={handleJumpToMessage}
          />
        </div>
      )}
    </div>
  )
}
