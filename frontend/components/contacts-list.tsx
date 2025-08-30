"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Settings } from "lucide-react"
import type { User, Chat } from "@/types/messaging"
import { formatDistanceToNow } from "date-fns"

interface ContactsListProps {
  chats: Chat[]
  currentUser: User
  users: User[]
  selectedChat: Chat | null
  onSelectChat: (chat: Chat) => void
}

export function ContactsList({ chats, currentUser, users, selectedChat, onSelectChat }: ContactsListProps) {
  const getOtherParticipant = (chat: Chat): User | null => {
    if (chat.isGroup) return null
    const otherUserId = chat.participants.find((id) => id !== currentUser.id)
    return users.find((user) => user.id === otherUserId) || null
  }

  const getChatName = (chat: Chat): string => {
    if (chat.isGroup && chat.name) return chat.name
    const otherUser = getOtherParticipant(chat)
    return otherUser?.name || "Unknown User"
  }

  const getChatAvatar = (chat: Chat): string => {
    if (chat.isGroup) return "/group-avatar.png"
    const otherUser = getOtherParticipant(chat)
    return otherUser?.avatar || "/professional-male-avatar.png"
  }

  const getLastMessagePreview = (chat: Chat): string => {
    if (!chat.lastMessage) return "No messages yet"
    const content = chat.lastMessage.content
    return content.length > 50 ? content.substring(0, 50) + "..." : content
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-sm">{currentUser.name}</h2>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search conversations..." className="pl-10" />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No conversations yet</p>
              <p className="text-sm">Start a new chat to begin messaging</p>
            </div>
          ) : (
            chats.map((chat) => {
              const otherUser = getOtherParticipant(chat)
              const isSelected = selectedChat?.id === chat.id

              return (
                <Button
                  key={chat.id}
                  variant={isSelected ? "secondary" : "ghost"}
                  className="w-full justify-start p-3 h-auto mb-1"
                  onClick={() => onSelectChat(chat)}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={getChatAvatar(chat) || "/placeholder.svg"} alt={getChatName(chat)} />
                        <AvatarFallback>{getChatName(chat).charAt(0)}</AvatarFallback>
                      </Avatar>
                      {!chat.isGroup && otherUser?.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm truncate">{getChatName(chat)}</h3>
                        {chat.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(chat.lastMessage.timestamp, { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">{getLastMessagePreview(chat)}</p>
                        {chat.lastMessage?.isRedacted && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            PII Protected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
