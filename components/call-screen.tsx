"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, PhoneOff, Mic, MicOff, Volume2, AlertTriangle, Shield, Flag } from "lucide-react"

interface CallScreenProps {
  callerNumber?: string
  callerName?: string
  scamRisk?: "low" | "medium" | "high"
  onEndCall?: () => void
}

export function CallScreen({
  callerNumber = "+1 (800) 555-0199",
  callerName = "Unknown Caller",
  scamRisk = "high",
  onEndCall,
}: CallScreenProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaker, setIsSpeaker] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [showScamAlert, setShowScamAlert] = useState(scamRisk === "high")

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "low":
        return <Shield className="w-4 h-4" />
      case "medium":
        return <AlertTriangle className="w-4 h-4" />
      case "high":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-background flex flex-col">
      {/* Scam Alert */}
      {showScamAlert && scamRisk === "high" && (
        <Alert className="mb-4 border-destructive bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive font-medium">
            <strong>SCAM ALERT:</strong> This number has been reported as fraudulent. Consider ending the call.
          </AlertDescription>
        </Alert>
      )}

      {/* Call Info */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        <div className="text-center space-y-2">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Phone className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-balance">{callerName}</h2>
          <p className="text-muted-foreground">{callerNumber}</p>
          <Badge variant="outline" className={`${getRiskColor(scamRisk)}`}>
            {getRiskIcon(scamRisk)}
            <span className="ml-1 capitalize">{scamRisk} Risk</span>
          </Badge>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">Call Duration</p>
          <p className="text-xl font-mono font-bold">{formatDuration(callDuration)}</p>
        </div>

        {/* Real-time Analysis */}
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Real-time Analysis</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• Voice pattern analysis: Suspicious</p>
              <p>• Number verification: Failed</p>
              <p>• Reported by 47 users as scam</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call Controls */}
      <div className="space-y-4">
        <div className="flex justify-center gap-4">
          <Button
            variant={isMuted ? "default" : "outline"}
            size="lg"
            className="rounded-full w-16 h-16"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          <Button
            variant={isSpeaker ? "default" : "outline"}
            size="lg"
            className="rounded-full w-16 h-16"
            onClick={() => setIsSpeaker(!isSpeaker)}
          >
            <Volume2 className="w-6 h-6" />
          </Button>

          <Button variant="outline" size="lg" className="rounded-full w-16 h-16 bg-transparent">
            <Flag className="w-6 h-6" />
          </Button>
        </div>

        <Button variant="destructive" size="lg" className="w-full rounded-full h-16" onClick={onEndCall}>
          <PhoneOff className="w-6 h-6 mr-2" />
          End Call
        </Button>
      </div>
    </div>
  )
}
