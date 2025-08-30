"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/types/messaging"

interface TypingIndicatorProps {
  users: User[]
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].name} is typing...`
    } else if (users.length === 2) {
      return `${users[0].name} and ${users[1].name} are typing...`
    } else {
      return `${users[0].name} and ${users.length - 1} others are typing...`
    }
  }

  return (
    <div className="flex items-center space-x-2 p-3 text-sm text-muted-foreground">
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user) => (
          <Avatar key={user.id} className="w-6 h-6 border-2 border-background">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <span>{getTypingText()}</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  )
}
