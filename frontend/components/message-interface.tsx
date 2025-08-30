"use client"

import { useState } from "react"
import { Send, Mic, Search, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { User, Chat } from "@/types/messaging"
import { cn } from "@/lib/utils"
import { VoiceRecorder } from "./voice-recorder" // <-- Import your recorder

interface MessageInterfaceProps {
  currentUser: User
  chats: Chat[]
  selectedChat: Chat | null
  onSelectChat: (chat: Chat) => void
  onSendMessage: (content: string | Blob, type?: "text" | "voice") => void
  users: User[]
}

export function MessageInterface({
  currentUser,
  chats,
  selectedChat,
  onSelectChat,
  onSendMessage,
  users,
}: MessageInterfaceProps) {
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim())
      setMessageInput("")
    }
  }

  const getUserById = (id: string) => users.find((user) => user.id === id)

  const getOtherParticipant = (chat: Chat) => {
    const otherUserId = chat.participants.find((id) => id !== currentUser.id)
    return otherUserId ? getUserById(otherUserId) : null
  }

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true
    const otherUser = getOtherParticipant(chat)
    return (
      otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Messages</h1>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredChats.map((chat) => {
              const otherUser = getOtherParticipant(chat)
              if (!otherUser) return null

              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                    selectedChat?.id === chat.id && "bg-accent",
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherUser.avatar || "/placeholder.svg"} alt={otherUser.name} />
                      <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {otherUser.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{otherUser.name}</h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-muted-foreground">{formatTime(chat.lastMessage.timestamp)}</span>
                      )}
                    </div>

                    {chat.lastMessage && (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage.type === "voice" && "🎤 "}
                          {chat.lastMessage.content}
                        </p>
                        {chat.lastMessage.isRedacted && (
                          <Badge variant="secondary" className="text-xs">
                            PII Protected
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const otherUser = getOtherParticipant(selectedChat)
                    return otherUser ? (
                      <>
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={otherUser.avatar || "/placeholder.svg"} alt={otherUser.name} />
                            <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {otherUser.isOnline && (
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                          )}
                        </div>
                        <div>
                          <h2 className="font-semibold">{otherUser.name}</h2>
                          <p className="text-sm text-muted-foreground">{otherUser.isOnline ? "Online" : "Offline"}</p>
                        </div>
                      </>
                    ) : null
                  })()}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon"></Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedChat.messages.map((message) => {
                  const isOwn = message.senderId === currentUser.id
                  const sender = getUserById(message.senderId)

                  return (
                    <div
                      key={message.id}
                      className={cn("flex gap-2 max-w-[70%]", isOwn ? "ml-auto flex-row-reverse" : "mr-auto")}
                    >
                      {!isOwn && (
                        <Avatar className="h-8 w-8 mt-auto">
                          <AvatarImage src={sender?.avatar || "/placeholder.svg"} alt={sender?.name} />
                          <AvatarFallback>{sender?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2 max-w-full",
                          isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            {message.type === "voice" && (
                              <div className="flex items-center gap-2 mb-1">
                                <Mic className="h-4 w-4" />
                                <span className="text-xs opacity-75">Voice message</span>
                              </div>
                            )}
                            <p className="text-sm break-words">{message.content}</p>
                          </div>

                          {message.isRedacted && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-xs ml-2">
                                    🛡️
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>PII automatically redacted</p>
                                  <p className="text-xs opacity-75">Protected: {message.redactedFields?.join(", ")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs opacity-75">{formatTime(message.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="pr-12"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowVoiceRecorder(true)}
                >
                  <Mic className="h-5 w-5" />
                </Button>

                <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {showVoiceRecorder && (
                <div className="mt-2">
                  <VoiceRecorder
                    onSendVoiceMessage={(audioBlob, duration) => {
                      onSendMessage(audioBlob, "voice")
                      setShowVoiceRecorder(false)
                    }}
                    onCancel={() => setShowVoiceRecorder(false)}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Welcome to Secure Messaging</h3>
              <p className="text-muted-foreground">
                Select a conversation to start messaging with automatic PII protection
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
