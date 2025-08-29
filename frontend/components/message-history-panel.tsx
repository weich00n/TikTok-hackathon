"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Download, Search, BarChart3, Shield, MessageSquare, Mic, X } from "lucide-react"
import type { Chat, Message, User } from "@/types/messaging"
import { format, startOfDay, subDays } from "date-fns"
import { MessageSearch } from "@/components/message-search"

interface MessageHistoryPanelProps {
  chat: Chat
  users: User[]
  currentUser: User
  onClose: () => void
  onJumpToMessage: (messageId: string) => void
}

interface MessageStats {
  totalMessages: number
  textMessages: number
  voiceMessages: number
  redactedMessages: number
  messagesLast7Days: number
  messagesLast30Days: number
}

export function MessageHistoryPanel({ chat, users, currentUser, onClose, onJumpToMessage }: MessageHistoryPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "search" | "export">("overview")
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())

  const calculateStats = (): MessageStats => {
    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)
    const thirtyDaysAgo = subDays(now, 30)

    return {
      totalMessages: chat.messages.length,
      textMessages: chat.messages.filter((m) => m.type === "text").length,
      voiceMessages: chat.messages.filter((m) => m.type === "voice").length,
      redactedMessages: chat.messages.filter((m) => m.isRedacted).length,
      messagesLast7Days: chat.messages.filter((m) => m.timestamp >= sevenDaysAgo).length,
      messagesLast30Days: chat.messages.filter((m) => m.timestamp >= thirtyDaysAgo).length,
    }
  }

  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {}

    chat.messages.forEach((message) => {
      const dateKey = format(startOfDay(message.timestamp), "yyyy-MM-dd")
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, messages]) => ({
        date: new Date(date),
        messages: messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      }))
  }

  const handleExportMessages = () => {
    const exportData = {
      chatId: chat.id,
      chatName: chat.name || "Direct Chat",
      exportDate: new Date().toISOString(),
      participants: chat.participants.map((id) => {
        const user = users.find((u) => u.id === id)
        return { id, name: user?.name || "Unknown User" }
      }),
      messages: chat.messages.map((message) => ({
        id: message.id,
        sender: users.find((u) => u.id === message.senderId)?.name || "Unknown User",
        content: message.content,
        type: message.type,
        timestamp: message.timestamp.toISOString(),
        isRedacted: message.isRedacted,
        redactedFields: message.redactedFields || [],
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chat-history-${chat.id}-${format(new Date(), "yyyy-MM-dd")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleMessageSelect = (message: Message) => {
    onJumpToMessage(message.id)
    onClose()
  }

  const stats = calculateStats()
  const messageGroups = groupMessagesByDate()

  if (activeTab === "search") {
    return (
      <MessageSearch
        chats={[chat]}
        users={users}
        onMessageSelect={(message) => handleMessageSelect(message)}
        onClose={() => setActiveTab("overview")}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Message History</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1">
          <Button
            variant={activeTab === "overview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === "search" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("search")}
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Button
            variant={activeTab === "export" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("export")}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Statistics */}
              <div>
                <h3 className="font-medium mb-3">Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Total Messages</span>
                    </div>
                    <span className="text-2xl font-bold">{stats.totalMessages}</span>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">PII Protected</span>
                    </div>
                    <span className="text-2xl font-bold">{stats.redactedMessages}</span>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Mic className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Voice Messages</span>
                    </div>
                    <span className="text-2xl font-bold">{stats.voiceMessages}</span>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Last 7 Days</span>
                    </div>
                    <span className="text-2xl font-bold">{stats.messagesLast7Days}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Message Timeline */}
              <div>
                <h3 className="font-medium mb-3">Message Timeline</h3>
                <div className="space-y-4">
                  {messageGroups.slice(0, 10).map(({ date, messages }) => (
                    <div key={date.toISOString()} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{format(date, "EEEE, MMMM d, yyyy")}</span>
                        <Badge variant="outline" className="text-xs">
                          {messages.length} message{messages.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>

                      <div className="ml-6 space-y-2">
                        {messages.slice(0, 3).map((message) => {
                          const sender = users.find((u) => u.id === message.senderId)
                          return (
                            <div
                              key={message.id}
                              className="p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => handleMessageSelect(message)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">{sender?.name || "Unknown User"}</span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-muted-foreground">
                                    {format(message.timestamp, "HH:mm")}
                                  </span>
                                  {message.type === "voice" && <Mic className="w-3 h-3 text-blue-600" />}
                                  {message.isRedacted && <Shield className="w-3 h-3 text-green-600" />}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{message.content}</p>
                            </div>
                          )
                        })}
                        {messages.length > 3 && (
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveTab("search")}>
                            View {messages.length - 3} more messages...
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Export Options</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Export your message history for backup or analysis purposes.
                </p>

                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">JSON Export</h4>
                        <p className="text-sm text-muted-foreground">Complete message history with metadata</p>
                      </div>
                      <Button onClick={handleExportMessages}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-lg opacity-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">PDF Export</h4>
                        <p className="text-sm text-muted-foreground">Formatted conversation history</p>
                      </div>
                      <Button disabled>
                        <Download className="w-4 h-4 mr-2" />
                        Coming Soon
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-lg opacity-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">CSV Export</h4>
                        <p className="text-sm text-muted-foreground">Spreadsheet-compatible format</p>
                      </div>
                      <Button disabled>
                        <Download className="w-4 h-4 mr-2" />
                        Coming Soon
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-3">Privacy Notice</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">PII Protection Maintained</p>
                      <p className="text-xs text-muted-foreground">
                        Exported messages maintain all PII redactions. Original sensitive information is not included in
                        exports to protect privacy.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
