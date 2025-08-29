"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Mic,
  Square,
  Play,
  Pause,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  MoreVertical,
  ArrowLeft,
  Paperclip,
} from "lucide-react"

interface TranscriptionSegment {
  text: string
  isSensitive: boolean
  sensitiveType?: string
}

interface VoiceMessage {
  id: string
  timestamp: Date
  duration: string
  transcription: TranscriptionSegment[]
  scamLikelihood: number
  isPlaying: boolean
  audioFile?: File
}

export function VoiceMessageTranscriber() {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState(0)
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false)
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: "1",
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      duration: "0:45",
      scamLikelihood: 87,
      isPlaying: false,
      transcription: [
        { text: "Hello, this is calling from your bank's security department. ", isSensitive: false },
        { text: "We've detected suspicious activity on your account ending in ", isSensitive: false },
        { text: "****", isSensitive: true, sensitiveType: "Account Number" },
        { text: ". To verify your identity, please provide your full ", isSensitive: false },
        { text: "***-**-****", isSensitive: true, sensitiveType: "SSN" },
        {
          text: " and your mother's maiden name. This is urgent and your account will be frozen if you don't respond within 10 minutes.",
          isSensitive: false,
        },
      ],
    },
  ])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mockTranscription: TranscriptionSegment[] = [
    { text: "Hi, I'm calling about your car's extended warranty. ", isSensitive: false },
    { text: "We need to update your information. Can you confirm your ", isSensitive: false },
    { text: "***-**-****", isSensitive: true, sensitiveType: "SSN" },
    { text: " and credit card number ", isSensitive: false },
    { text: "****-****-****-****", isSensitive: true, sensitiveType: "Credit Card" },
    { text: "?", isSensitive: false },
  ]

  const handleStartRecording = () => {
    setIsRecording(true)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    simulateTranscription()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      simulateTranscription(file)
    }
  }

  const simulateTranscription = (audioFile?: File) => {
    setIsTranscribing(true)
    setTranscriptionProgress(0)

    const interval = setInterval(() => {
      setTranscriptionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsTranscribing(false)

          const newMessage: VoiceMessage = {
            id: Date.now().toString(),
            timestamp: new Date(),
            duration: "0:32",
            scamLikelihood: 65,
            isPlaying: false,
            transcription: mockTranscription,
            audioFile,
          }
          setMessages((prev) => [...prev, newMessage])
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const togglePlayback = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isPlaying: !msg.isPlaying } : { ...msg, isPlaying: false })),
    )
  }

  const getScamRiskColor = (likelihood: number) => {
    if (likelihood >= 70) return "text-red-500"
    if (likelihood >= 40) return "text-yellow-500"
    return "text-green-500"
  }

  const getScamRiskBadge = (likelihood: number) => {
    if (likelihood >= 70) return { variant: "destructive" as const, text: "High Risk" }
    if (likelihood >= 40) return { variant: "secondary" as const, text: "Medium Risk" }
    return { variant: "default" as const, text: "Low Risk" }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-background">
      <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <ArrowLeft className="h-6 w-6" />
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold">VoiceGuard</h1>
            <p className="text-xs opacity-90">Scam Detection Active</p>
          </div>
        </div>
        <MoreVertical className="h-6 w-6" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs ml-auto">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full bg-primary/10"
                  onClick={() => togglePlayback(message.id)}
                >
                  {message.isPlaying ? (
                    <Pause className="h-4 w-4 text-primary" />
                  ) : (
                    <Play className="h-4 w-4 text-primary" />
                  )}
                </Button>

                <div className="flex-1 flex items-center gap-1">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 bg-primary/30 rounded-full ${message.isPlaying && i < 6 ? "bg-primary" : ""}`}
                      style={{ height: `${Math.random() * 20 + 8}px` }}
                    />
                  ))}
                </div>

                <span className="text-xs text-muted-foreground">{message.duration}</span>
              </div>

              <div className="text-xs text-muted-foreground text-right mt-1">{formatTime(message.timestamp)}</div>
            </div>

            {message.scamLikelihood >= 40 && (
              <Alert className="border-destructive/50 max-w-xs ml-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>Potential Scam Detected</span>
                    <Badge {...getScamRiskBadge(message.scamLikelihood)} className="text-xs">
                      {message.scamLikelihood}%
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-500 text-white rounded-lg p-3 shadow-sm max-w-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs opacity-90">Transcription</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                >
                  {showSensitiveInfo ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>

              <div className="text-sm leading-relaxed">
                {message.transcription.map((segment, index) => (
                  <span key={index}>
                    {segment.isSensitive && !showSensitiveInfo ? (
                      <span
                        className="bg-white/20 px-1 rounded cursor-pointer"
                        title={`Hidden ${segment.sensitiveType}`}
                      >
                        {segment.text}
                      </span>
                    ) : (
                      <span className={segment.isSensitive ? "bg-white/10 px-1 rounded" : ""}>{segment.text}</span>
                    )}
                  </span>
                ))}
              </div>

              <div className="text-xs opacity-75 text-right mt-2">{formatTime(message.timestamp)}</div>
            </div>
          </div>
        ))}

        {isTranscribing && (
          <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs ml-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Analyzing message...</span>
            </div>
            <Progress value={transcriptionProgress} className="w-full h-2" />
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || isTranscribing}
            className="h-10 w-10 p-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-sm text-muted-foreground flex-1">
              {isRecording ? "Recording voice message..." : "Upload voice message"}
            </span>
          </div>

          <Button
            className={`h-10 w-10 p-0 rounded-full ${isRecording ? "bg-red-500 hover:bg-red-600" : ""}`}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isTranscribing}
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>

        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
      </div>
    </div>
  )
}
