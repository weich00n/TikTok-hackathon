"use client"

import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { MessageStatusType } from "@/lib/realtime-service"

interface MessageStatusProps {
  status: MessageStatusType["status"]
  timestamp?: Date
  className?: string
}

export function MessageStatusComponent({ status, timestamp, className }: MessageStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "sending":
        return <Clock className="w-3 h-3 text-muted-foreground animate-pulse" />
      case "sent":
        return <Check className="w-3 h-3 text-muted-foreground" />
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      default:
        return <AlertCircle className="w-3 h-3 text-destructive" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "sending":
        return "Sending..."
      case "sent":
        return "Sent"
      case "delivered":
        return "Delivered"
      case "read":
        return "Read"
      default:
        return "Failed to send"
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={className}>{getStatusIcon()}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusText()}</p>
          {timestamp && <p className="text-xs opacity-70">{timestamp.toLocaleTimeString()}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
