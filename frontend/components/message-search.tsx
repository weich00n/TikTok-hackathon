"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Search, X, Calendar, User, FileText, Mic, Shield, Filter } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Message, User as UserType, Chat } from "@/types/messaging"
import { format, isToday, isYesterday, startOfWeek, endOfWeek } from "date-fns"

interface MessageSearchProps {
  chats: Chat[]
  users: UserType[]
  onMessageSelect: (message: Message, chat: Chat) => void
  onClose: () => void
}

interface SearchFilters {
  dateRange: "all" | "today" | "yesterday" | "week" | "month"
  messageType: "all" | "text" | "voice"
  sender: "all" | string
  hasRedactions: "all" | "yes" | "no"
}

export function MessageSearch({ chats, users, onMessageSelect, onClose }: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ message: Message; chat: Chat }>>([])
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: "all",
    messageType: "all",
    sender: "all",
    hasRedactions: "all",
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      performSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery, filters])

  const performSearch = async () => {
    setIsLoading(true)

    // Simulate search delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    const results: Array<{ message: Message; chat: Chat }> = []

    chats.forEach((chat) => {
      chat.messages.forEach((message) => {
        // Text search
        const matchesQuery =
          searchQuery.trim() === "" ||
          message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (message.originalContent && message.originalContent.toLowerCase().includes(searchQuery.toLowerCase()))

        // Apply filters
        const matchesFilters = applyFilters(message)

        if (matchesQuery && matchesFilters) {
          results.push({ message, chat })
        }
      })
    })

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.message.timestamp.getTime() - a.message.timestamp.getTime())

    setSearchResults(results)
    setIsLoading(false)
  }

  const applyFilters = (message: Message): boolean => {
    // Date range filter
    if (filters.dateRange !== "all") {
      const messageDate = message.timestamp
      const now = new Date()

      switch (filters.dateRange) {
        case "today":
          if (!isToday(messageDate)) return false
          break
        case "yesterday":
          if (!isYesterday(messageDate)) return false
          break
        case "week":
          const weekStart = startOfWeek(now)
          const weekEnd = endOfWeek(now)
          if (messageDate < weekStart || messageDate > weekEnd) return false
          break
        case "month":
          if (messageDate.getMonth() !== now.getMonth() || messageDate.getFullYear() !== now.getFullYear()) {
            return false
          }
          break
      }
    }

    // Message type filter
    if (filters.messageType !== "all" && message.type !== filters.messageType) {
      return false
    }

    // Sender filter
    if (filters.sender !== "all" && message.senderId !== filters.sender) {
      return false
    }

    // Redactions filter
    if (filters.hasRedactions !== "all") {
      const hasRedactions = message.isRedacted
      if (filters.hasRedactions === "yes" && !hasRedactions) return false
      if (filters.hasRedactions === "no" && hasRedactions) return false
    }

    return true
  }

  const getSenderName = (senderId: string): string => {
    const user = users.find((u) => u.id === senderId)
    return user?.name || "Unknown User"
  }

  const getChatName = (chat: Chat): string => {
    if (chat.isGroup && chat.name) return chat.name
    // For direct chats, find the other participant
    const otherUserId = chat.participants.find((id) => id !== chat.participants[0]) // Simplified
    const otherUser = users.find((u) => u.id === otherUserId)
    return otherUser?.name || "Direct Chat"
  }

  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "MMM d, yyyy")
  }

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Search Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Search Messages</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => setFilters({ ...filters, dateRange: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Message Type</label>
                  <Select
                    value={filters.messageType}
                    onValueChange={(value) => setFilters({ ...filters, messageType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="text">Text only</SelectItem>
                      <SelectItem value="voice">Voice only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sender</label>
                  <Select value={filters.sender} onValueChange={(value) => setFilters({ ...filters, sender: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All senders</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">PII Protection</label>
                  <Select
                    value={filters.hasRedactions}
                    onValueChange={(value) => setFilters({ ...filters, hasRedactions: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All messages</SelectItem>
                      <SelectItem value="yes">Protected only</SelectItem>
                      <SelectItem value="no">Unprotected only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active filters display */}
          {(filters.dateRange !== "all" ||
            filters.messageType !== "all" ||
            filters.sender !== "all" ||
            filters.hasRedactions !== "all") && (
            <div className="flex items-center space-x-1">
              {filters.dateRange !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {filters.dateRange}
                </Badge>
              )}
              {filters.messageType !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  {filters.messageType === "voice" ? (
                    <Mic className="w-3 h-3 mr-1" />
                  ) : (
                    <FileText className="w-3 h-3 mr-1" />
                  )}
                  {filters.messageType}
                </Badge>
              )}
              {filters.sender !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  <User className="w-3 h-3 mr-1" />
                  {getSenderName(filters.sender)}
                </Badge>
              )}
              {filters.hasRedactions !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  {filters.hasRedactions === "yes" ? "Protected" : "Unprotected"}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              Searching...
            </div>
          ) : searchQuery.trim() === "" ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Enter a search term to find messages</p>
              <p className="text-sm">Search through all your conversations</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages found</p>
              <p className="text-sm">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Found {searchResults.length} message{searchResults.length !== 1 ? "s" : ""}
              </div>

              {searchResults.map(({ message, chat }, index) => {
                const sender = users.find((u) => u.id === message.senderId)

                return (
                  <div
                    key={`${message.id}-${index}`}
                    className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onMessageSelect(message, chat)}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={sender?.avatar || "/placeholder.svg"} alt={sender?.name || "User"} />
                        <AvatarFallback>{sender?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{getSenderName(message.senderId)}</span>
                            <span className="text-xs text-muted-foreground">in {getChatName(chat)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {getDateLabel(message.timestamp)} at {format(message.timestamp, "HH:mm")}
                            </span>
                            {message.type === "voice" && (
                              <Badge variant="outline" className="text-xs">
                                <Mic className="w-3 h-3 mr-1" />
                                Voice
                              </Badge>
                            )}
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
                                    <p>PII was redacted from this message</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {highlightText(message.content, searchQuery)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
