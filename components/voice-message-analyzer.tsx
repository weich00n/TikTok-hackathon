"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, Square, AlertTriangle, Shield, Eye, EyeOff } from "lucide-react"

interface TranscriptionSegment {
  text: string
  timestamp: number
  isScamIndicator: boolean
  isSensitive: boolean
  confidence: number
}

export function VoiceMessageAnalyzer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(45) // Sample 45 second message
  const [scamRisk, setScamRisk] = useState(0)
  const [showSensitive, setShowSensitive] = useState(false)
  const [transcription, setTranscription] = useState<TranscriptionSegment[]>([])

  // Sample transcription data
  const sampleTranscription: TranscriptionSegment[] = [
    { text: "Hello, this is calling from", timestamp: 2, isScamIndicator: false, isSensitive: false, confidence: 0.95 },
    { text: "Microsoft technical support", timestamp: 4, isScamIndicator: true, isSensitive: false, confidence: 0.88 },
    {
      text: "We've detected suspicious activity on your computer",
      timestamp: 8,
      isScamIndicator: true,
      isSensitive: false,
      confidence: 0.92,
    },
    {
      text: "Please provide your social security number",
      timestamp: 12,
      isScamIndicator: true,
      isSensitive: false,
      confidence: 0.89,
    },
    { text: "***-**-****", timestamp: 15, isScamIndicator: false, isSensitive: true, confidence: 0.97 },
    {
      text: "and your credit card information",
      timestamp: 18,
      isScamIndicator: true,
      isSensitive: false,
      confidence: 0.91,
    },
    { text: "****-****-****-****", timestamp: 22, isScamIndicator: false, isSensitive: true, confidence: 0.96 },
    {
      text: "to verify your identity immediately",
      timestamp: 26,
      isScamIndicator: true,
      isSensitive: false,
      confidence: 0.87,
    },
  ]

  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 0.1
          if (newTime >= duration) {
            setIsPlaying(false)
            return duration
          }

          // Simulate real-time transcription
          const newSegments = sampleTranscription.filter((seg) => seg.timestamp <= newTime)
          setTranscription(newSegments)

          // Calculate scam risk based on indicators
          const scamIndicators = newSegments.filter((seg) => seg.isScamIndicator).length
          const totalSegments = newSegments.length
          const risk = totalSegments > 0 ? Math.min((scamIndicators / totalSegments) * 100, 95) : 0
          setScamRisk(risk)

          return newTime
        })
      }, 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, duration])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleStop = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    setTranscription([])
    setScamRisk(0)
  }

  const getRiskColor = (risk: number) => {
    if (risk < 30) return "text-green-600"
    if (risk < 70) return "text-yellow-600"
    return "text-destructive"
  }

  const getRiskBadgeVariant = (risk: number) => {
    if (risk < 30) return "default"
    if (risk < 70) return "secondary"
    return "destructive"
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-foreground">Voice Scam Detector</h1>
        <p className="text-muted-foreground">AI-powered voice message analysis</p>
      </div>

      {/* Risk Assessment Card */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Risk Assessment</CardTitle>
            <Badge variant={getRiskBadgeVariant(scamRisk)} className="flex items-center gap-1">
              {scamRisk < 30 ? <Shield className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {scamRisk.toFixed(0)}% Risk
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={scamRisk} className="h-2" />
            <p className={`text-sm font-medium ${getRiskColor(scamRisk)}`}>
              {scamRisk < 30 && "Low risk - Message appears legitimate"}
              {scamRisk >= 30 && scamRisk < 70 && "Medium risk - Some suspicious indicators"}
              {scamRisk >= 70 && "High risk - Likely scam attempt"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Audio Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" onClick={handlePlayPause} className="w-12 h-12 bg-transparent">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleStop} className="w-12 h-12 bg-transparent">
                <Square className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Progress value={(currentTime / duration) * 100} className="h-1" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.floor(currentTime)}s</span>
                <span>{duration}s</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcription Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Live Transcription</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSensitive(!showSensitive)}
              className="flex items-center gap-1"
            >
              {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showSensitive ? "Hide" : "Show"} Sensitive
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transcription.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">Press play to start transcription...</p>
            ) : (
              transcription.map((segment, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-xs text-muted-foreground min-w-[30px]">{segment.timestamp}s</span>
                  <span
                    className={`flex-1 ${
                      segment.isScamIndicator
                        ? "bg-destructive/10 text-destructive px-1 rounded"
                        : segment.isSensitive && !showSensitive
                          ? "bg-muted text-muted blur-sm select-none"
                          : segment.isSensitive
                            ? "bg-yellow-100 text-yellow-800 px-1 rounded"
                            : "text-foreground"
                    }`}
                  >
                    {segment.text}
                  </span>
                  {segment.isScamIndicator && <AlertTriangle className="w-3 h-3 text-destructive mt-0.5" />}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      {transcription.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scam Indicators:</span>
                <span className="font-medium text-destructive">
                  {transcription.filter((s) => s.isScamIndicator).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sensitive Data:</span>
                <span className="font-medium text-yellow-600">
                  {transcription.filter((s) => s.isSensitive).length} items
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence:</span>
                <span className="font-medium">
                  {transcription.length > 0
                    ? Math.round((transcription.reduce((acc, s) => acc + s.confidence, 0) / transcription.length) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
