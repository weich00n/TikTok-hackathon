"use client"
import { useState, useEffect } from "react"
import { MessageInterface } from "@/components/message-interface"
import type { User, Chat, Message } from "@/types/messaging"
import { mockUsers, mockChats } from "@/lib/mock-data"
import { piiDetector } from "@/lib/pii-utils"

export default function MessagingApp() {
  const [currentUser] = useState<User>(mockUsers[0]) // Default to first mock user
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [useBackendPII, setUseBackendPII] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')

  useEffect(() => {
    const userChats = mockChats.filter((chat) => chat.participants.includes(currentUser.id))
    setChats(userChats)

    // Auto-select first chat for demo
    if (userChats.length > 0 && !selectedChat) {
      setSelectedChat(userChats[0])
    }
  }, [currentUser.id, selectedChat])

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch("http://localhost:5000/detect_pii", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "test" }),
        })
        if (response.ok) {
          setBackendStatus('available')
        } else {
          setBackendStatus('unavailable')
        }
      } catch (error) {
        console.log("Backend not available, using client-side detection")
        setBackendStatus('unavailable')
      }
    }
    checkBackend()
  }, [])


  const handleSendMessage = async (content: string | Blob, type: "text" | "voice" = "text") => {
    if (!selectedChat) return

    let processedContent = ""
    let piiResult = { hasRedactions: false, detectedFields: [] }

    try {
      if (type === "voice" && content instanceof Blob) {
        // Send audio to backend for transcription and PII detection
        const formData = new FormData()
        formData.append("audio", content, "voice-message.wav")
        const response = await fetch("http://localhost:5000/api/process_voice", {
          method: "POST",
          body: formData,
        })
        const data = await response.json()
        processedContent = data.piiDetection?.redactedContent || data.transcribed_text || "[Unrecognized audio]"
        piiResult = data.piiDetection || { hasRedactions: false, detectedFields: [] }
      } else if (typeof content === "string") {
        // Only use string methods here!
        // ...PII detection or text processing...
        // Example:
        // piiResult = detectPII(content);
        // processedContent = piiResult.hasRedactions ? piiResult.redactedContent : content;
      }
    } catch (error) {
      console.error("Message processing failed:", error)
      processedContent = typeof content === "string" ? content : "[Audio message]"
    }

    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId: selectedChat.id,
      senderId: currentUser.id,
      content: processedContent,
      type,
      timestamp: new Date(),
      isRedacted: piiResult.hasRedactions,
      originalContent: content,
      redactedFields: piiResult.detectedFields,
    }

    const updatedChat = {
      ...selectedChat,
      messages: [...selectedChat.messages, newMessage],
      lastMessage: newMessage,
      updatedAt: new Date(),
    }

    setSelectedChat(updatedChat)
    setChats((prevChats) => prevChats.map((chat) => (chat.id === selectedChat.id ? updatedChat : chat)))

    console.log("[v0] Message sent:", newMessage)
    console.log("PII Detection Method:", useBackendPII && backendStatus === 'available' ? 'Backend' : 'Client-side')

  }

  return (
    <div className="h-screen bg-background">
      <div className="p-2 text-sm text-muted-foreground border-b">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              backendStatus === 'available' ? 'bg-green-500' : 
              backendStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span>
              Backend: {backendStatus === 'available' ? 'Connected' : 
                       backendStatus === 'checking' ? 'Checking...' : 'Offline'}
            </span>
          </div>
          
          {backendStatus === 'available' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useBackendPII}
                onChange={(e) => setUseBackendPII(e.target.checked)}
                className="rounded"
              />
              <span>Use AI PII Detection</span>
            </label>
          )}
        </div>
      </div>

      <MessageInterface
        currentUser={currentUser}
        chats={chats}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        onSendMessage={handleSendMessage}
        users={mockUsers}
      />
    </div>
  )
}
