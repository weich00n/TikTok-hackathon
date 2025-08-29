"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Play, Pause, Volume2, Shield } from "lucide-react"
import type { Message } from "@/types/messaging"
import { format } from "date-fns"

interface VoiceMessageProps {
  message: Message
  isOwnMessage: boolean
}

export function VoiceMessage({ message, isOwnMessage }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Mock audio duration (in a real app, this would come from the audio file)
  const mockDuration = 15 + Math.random() * 30 // 15-45 seconds

  useEffect(() => {
    setDuration(mockDuration)
  }, [mockDuration])

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false)
      // In a real app, pause the audio
      if (audioRef.current) {
        audioRef.current.pause()
      }
    } else {
      setIsPlaying(true)
      // Simulate playback
      simulatePlayback()
    }
  }

  const simulatePlayback = () => {
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + 0.1 * playbackSpeed
        if (newTime >= duration) {
          setIsPlaying(false)
          clearInterval(interval)
          return 0
        }
        return newTime
      })
    }, 100)
  }

  const changePlaybackSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2]
    const currentIndex = speeds.indexOf(playbackSpeed)
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
    setPlaybackSpeed(nextSpeed)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-lg max-w-xs ${
        isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
      }`}
    >
      {/* Play/Pause Button */}
      <Button
        variant={isOwnMessage ? "secondary" : "outline"}
        size="sm"
        onClick={togglePlayback}
        className="shrink-0 w-10 h-10 rounded-full"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>

      {/* Waveform and Controls */}
      <div className="flex-1 space-y-2">
        {/* Waveform Visualization */}
        <div className="flex items-center space-x-1 h-8">
          {Array.from({ length: 20 }).map((_, index) => {
            const height = Math.random() * 100
            const isActive = progressPercentage > (index / 20) * 100
            return (
              <div
                key={index}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? isOwnMessage
                      ? "bg-primary-foreground"
                      : "bg-primary"
                    : isOwnMessage
                      ? "bg-primary-foreground/30"
                      : "bg-muted-foreground/30"
                }`}
                style={{ height: `${Math.max(height * 0.3, 8)}px` }}
              />
            )
          })}
        </div>

        {/* Progress and Time */}
        <div className="flex items-center justify-between text-xs">
          <span className={isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex items-center space-x-2">
            {/* Playback Speed */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={changePlaybackSpeed} className="h-6 px-2 text-xs">
                    {playbackSpeed}x
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Playback speed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Voice Message Indicator */}
            <Badge variant="secondary" className="text-xs h-5">
              <Volume2 className="w-3 h-3 mr-1" />
              Voice
            </Badge>
          </div>
        </div>
      </div>

      {/* Message Info */}
      <div className="flex flex-col items-end space-y-1">
        <span className={`text-xs ${isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {format(message.timestamp, "HH:mm")}
        </span>

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
                <p>Voice message was transcribed and PII was redacted</p>
                <p className="text-xs">Transcript: "{message.content}"</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Hidden audio element for real implementation */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
      />
    </div>
  )
}
