"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Mic, Play, Pause, Square, Send, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceRecorderProps {
  onSendVoiceMessage: (audioBlob: Blob, duration: number) => void
  onCancel: () => void
  isProcessing?: boolean
}

export function VoiceRecorder({ onSendVoiceMessage, onCancel, isProcessing = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // Simulate waveform data
      generateWaveform()
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    }
  }

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const generateWaveform = () => {
    const updateWaveform = () => {
      if (isRecording && !isPaused) {
        setWaveformData((prev) => {
          const newData = [...prev, Math.random() * 100]
          return newData.slice(-50) // Keep last 50 data points
        })
      }
      if (isRecording) {
        animationRef.current = requestAnimationFrame(updateWaveform)
      }
    }
    updateWaveform()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSend = () => {
    if (audioBlob) {
      const formData = new FormData()
      formData.append("audio", audioBlob, "voice-message.wav")
      console.log("Sending audio blob:", audioBlob)
      console.log("Blob type:", audioBlob.type, "Blob size:", audioBlob.size)
      onSendVoiceMessage(audioBlob, recordingTime)
    }
  }

  const handleDelete = () => {
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setRecordingTime(0)
    setWaveformData([])
    setIsPlaying(false)
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Recording Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isRecording && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">{isPaused ? "Paused" : "Recording"}</span>
            </div>
          )}
          {audioBlob && !isRecording && (
            <Badge variant="secondary" className="text-xs">
              Ready to send
            </Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground font-mono">{formatTime(recordingTime)}</span>
      </div>

      {/* Waveform Visualization */}
      {(isRecording || waveformData.length > 0) && (
        <div className="h-16 bg-muted rounded-md p-2 flex items-end justify-center space-x-1">
          {waveformData.map((height, index) => (
            <div
              key={index}
              className={cn(
                "w-1 bg-primary rounded-full transition-all duration-100",
                isRecording && !isPaused ? "animate-pulse" : "",
              )}
              style={{ height: `${Math.max(height * 0.4, 4)}px` }}
            />
          ))}
          {waveformData.length === 0 && <div className="text-xs text-muted-foreground">Waveform will appear here</div>}
        </div>
      )}

      {/* Playback Controls */}
      {audioBlob && !isRecording && (
        <div className="space-y-2">
          <audio
            ref={audioRef}
            src={audioUrl || undefined}
            onEnded={() => setIsPlaying(false)}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setRecordingTime(Math.floor(audioRef.current.duration))
              }
            }}
          />
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={isPlaying ? pausePlayback : playRecording}
              disabled={isProcessing}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <div className="flex-1">
              <Progress value={isPlaying ? 50 : 0} className="h-2" />
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {!isRecording && !audioBlob && (
            <Button onClick={startRecording} disabled={isProcessing}>
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <div className="flex items-center space-x-2">
              {!isPaused ? (
                <Button variant="outline" onClick={pauseRecording}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button variant="outline" onClick={resumeRecording}>
                  <Mic className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button variant="destructive" onClick={stopRecording}>
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>
          )}

          {audioBlob && !isRecording && (
            <Button variant="outline" onClick={handleDelete} disabled={isProcessing}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          {audioBlob && !isRecording && (
            <Button onClick={handleSend} disabled={isProcessing}>
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="text-center p-4 bg-muted rounded-md">
          <div className="text-sm text-muted-foreground mb-2">Transcribing audio and scanning for PII...</div>
          <Progress value={undefined} className="h-2" />
        </div>
      )}
    </div>
  )
}
