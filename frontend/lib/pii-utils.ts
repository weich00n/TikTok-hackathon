import type { PIIDetectionResult } from "@/types/messaging"

/**
 * Advanced client-side PII detection utility
 * Enhanced with more comprehensive patterns and better accuracy
 */
export class PIIDetector {
  private patterns = {
    phone_number: [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // US format: 123-456-7890
      /\b$$\d{3}$$\s?\d{3}[-.]?\d{4}\b/g, // Fixed regex - escaped parentheses properly
      /\b\+\d{1,3}[-.\s]?\d{1,14}\b/g, // International: +1-234-567-8900
      /\b\d{3}\s\d{3}\s\d{4}\b/g, // Spaced format: 123 456 7890
    ],
    email: [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      /\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b/g, // With spaces
    ],
    ssn: [
      /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, // 123-45-6789
      /\b\d{3}\s\d{2}\s\d{4}\b/g, // 123 45 6789
    ],
    credit_card: [
      /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, // 1234-5678-9012-3456
      /\b\d{13,19}\b/g, // Continuous digits 13-19 length
    ],
    address: [
      /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way|Circle|Cir)\b/gi,
      /\b\d+\s+[A-Za-z\s]+(?:St\.|Ave\.|Rd\.|Blvd\.|Ln\.|Dr\.|Ct\.|Pl\.)\b/gi, // Abbreviated
    ],
    ip_address: [
      /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, // IPv4: 192.168.1.1
      /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g, // IPv6
    ],
    date_of_birth: [
      /\b(?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01])[-/.](?:19|20)\d{2}\b/g, // MM/DD/YYYY
      /\b(?:0[1-9]|[12]\d|3[01])[-/.](?:0[1-9]|1[0-2])[-/.](?:19|20)\d{2}\b/g, // DD/MM/YYYY
      /\b(?:19|20)\d{2}[-/.](?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01])\b/g, // YYYY/MM/DD
    ],
    bank_account: [
      /\b\d{8,17}\b/g, // Bank account numbers (8-17 digits)
    ],
    driver_license: [
      /\b[A-Z]{1,2}\d{6,8}\b/g, // State + numbers format
    ],
    passport: [
      /\b[A-Z]{1,2}\d{6,9}\b/g, // Passport format
    ],
    name_patterns: [
      /\bmy name is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /\bi'm\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /\bcall me\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    ],
  }

  detectPII(text: string): PIIDetectionResult {
    let redactedText = text
    const detectedFields: string[] = []
    const detectionDetails: Array<{
      type: string
      original: string
      confidence: number
      position: [number, number]
    }> = []

    for (const [piiType, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const matches = Array.from(text.matchAll(pattern))

        for (const match of matches) {
          if (match[0] && match.index !== undefined) {
            const original = match[0]
            const confidence = this.calculateConfidence(piiType, original, text)

            // Only redact if confidence is above threshold
            if (confidence > 0.7) {
              detectedFields.push(piiType)
              detectionDetails.push({
                type: piiType,
                original,
                confidence,
                position: [match.index, match.index + original.length],
              })

              // Use context-aware redaction
              const redactionText = this.getRedactionText(piiType, original)
              redactedText = redactedText.replace(original, redactionText)
            }
          }
        }
      }
    }

    return {
      hasRedactions: detectedFields.length > 0,
      redactedContent: redactedText,
      detectedFields: [...new Set(detectedFields)],
      originalContent: text,
      detectionDetails,
    }
  }

  private calculateConfidence(piiType: string, match: string, context: string): number {
    let confidence = 0.8 // Base confidence

    switch (piiType) {
      case "phone_number":
        if (/^\+?1?[-.\s]?$$\d{3}$$[-.\s]?\d{3}[-.\s]?\d{4}$/.test(match)) {
          confidence = 0.95
        }
        // Lower confidence for sequences that might be other numbers
        if (context.toLowerCase().includes("price") || context.toLowerCase().includes("cost")) {
          confidence = 0.3
        }
        break

      case "email":
        // Very high confidence for well-formed emails
        confidence = 0.98
        break

      case "ssn":
        // High confidence for SSN pattern
        confidence = 0.95
        break

      case "credit_card":
        // Check if it's a valid credit card using Luhn algorithm
        confidence = this.isValidCreditCard(match) ? 0.9 : 0.6
        break

      case "address":
        // Higher confidence if it contains common address indicators
        if (/\b(?:apt|apartment|suite|unit|floor|#)\b/i.test(context)) {
          confidence = 0.9
        }
        break

      case "ip_address":
        // Validate IP address format
        const parts = match.split(".")
        if (parts.every((part) => Number.parseInt(part) <= 255)) {
          confidence = 0.9
        } else {
          confidence = 0.4
        }
        break
    }

    return confidence
  }

  private isValidCreditCard(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, "")
    if (digits.length < 13 || digits.length > 19) return false

    let sum = 0
    let isEven = false

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = Number.parseInt(digits[i])

      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }

      sum += digit
      isEven = !isEven
    }

    return sum % 10 === 0
  }

  processVoiceMessage(audioBlob: Blob): Promise<PIIDetectionResult> {
    return new Promise((resolve) => {
      // Simulate more realistic transcription delay
      setTimeout(
        () => {
          // Enhanced mock transcription with various PII types
          const mockTranscripts = [
            "Hi, this is a voice message. My number is 555-123-4567 if you need to reach me.",
            "Hey, can you send the documents to john.doe@company.com? My address is 123 Main Street.",
            "I'll call you from my phone 555-987-6543. My email is jane@example.com for reference.",
            "The meeting is at 456 Oak Avenue. You can reach me at (555) 234-5678.",
            "My SSN is 123-45-6789 for the verification process.",
          ]

          const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
          const result = this.detectPII(randomTranscript)

          // Add voice-specific metadata
          result.messageType = "voice"
          result.transcriptionConfidence = 0.85 + Math.random() * 0.1 // 85-95%

          resolve(result)
        },
        1500 + Math.random() * 1000,
      ) // 1.5-2.5 second delay
    })
  }

  batchDetectPII(messages: string[]): PIIDetectionResult[] {
    return messages.map((message) => this.detectPII(message))
  }

  getPIIStatistics(results: PIIDetectionResult[]): {
    totalMessages: number
    messagesWithPII: number
    piiTypes: Record<string, number>
    redactionRate: number
  } {
    const totalMessages = results.length
    const messagesWithPII = results.filter((r) => r.hasRedactions).length
    const piiTypes: Record<string, number> = {}

    results.forEach((result) => {
      result.detectedFields.forEach((field) => {
        piiTypes[field] = (piiTypes[field] || 0) + 1
      })
    })

    return {
      totalMessages,
      messagesWithPII,
      piiTypes,
      redactionRate: totalMessages > 0 ? messagesWithPII / totalMessages : 0,
    }
  }

  async detectPIIWithModel(text: string): Promise<PIIDetectionResult> {
    try {
      const response = await fetch("http://localhost:5000/detect_pii", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }

      const result = await response.json()
      
      // Transform backend response to match our interface
      return {
        hasRedactions: result.hasRedactions || false,
        redactedContent: result.redactedContent || text,
        detectedFields: result.detectionDetails?.map((d: any) => d.type) || [],
        originalContent: result.originalContent || text,
        detectionDetails: result.detectionDetails || [],
      }
    } catch (error) {
      console.error("Backend PII detection failed:", error)
      // Fallback to client-side detection
      return this.detectPII(text)
    }
  }

  // Hybrid approach - uses both client-side and backend detection
  async detectPIIHybrid(text: string): Promise<PIIDetectionResult> {
    try {
      // Get both results
      const [regexResult, modelResult] = await Promise.all([
        Promise.resolve(this.detectPII(text)),
        this.detectPIIWithModel(text)
      ])

      // Combine results (backend takes precedence for conflicts)
      let redactedText = text
      const detectedFields = new Set<string>()
      const detectionDetails: any[] = []

      // Apply client-side detections first
      regexResult.detectionDetails.forEach((d) => {
        redactedText = redactedText.replace(d.original, this.getRedactionText(d.type, d.original))
        detectedFields.add(d.type)
        detectionDetails.push({ ...d, source: 'regex' })
      })

      // Apply backend detections (may override some client-side ones)
      modelResult.detectionDetails?.forEach((d: any) => {
        const redactionStr = this.getRedactionText(d.type, d.original)
        if (!redactedText.includes(redactionStr)) {
          redactedText = redactedText.replace(d.original, redactionStr)
        }
        detectedFields.add(d.type)
        detectionDetails.push({ ...d, source: 'model' })
      })

      return {
        hasRedactions: detectedFields.size > 0,
        redactedContent: redactedText,
        detectedFields: [...detectedFields],
        originalContent: text,
        detectionDetails,
      }
    } catch (error) {
      console.error("Hybrid PII detection failed:", error)
      return this.detectPII(text)
    }
  }

  private calculateConfidence(piiType: string, match: string, context: string): number {
    let confidence = 0.8

    switch (piiType) {
      case "phone_number":
        if (/^\+?1?[-.\s]?\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4}$/.test(match)) {
          confidence = 0.95
        }
        if (context.toLowerCase().includes("price") || context.toLowerCase().includes("cost")) {
          confidence = 0.3
        }
        break

      case "email":
        confidence = 0.98
        break

      case "ssn":
        confidence = 0.95
        break

      case "credit_card":
        confidence = this.isValidCreditCard(match) ? 0.9 : 0.6
        break

      case "address":
        if (/\b(?:apt|apartment|suite|unit|floor|#)\b/i.test(context)) {
          confidence = 0.9
        }
        break

      case "ip_address":
        const parts = match.split(".")
        if (parts.every((part) => Number.parseInt(part) <= 255)) {
          confidence = 0.9
        } else {
          confidence = 0.4
        }
        break
    }

    return confidence
  }

  private isValidCreditCard(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, "")
    if (digits.length < 13 || digits.length > 19) return false

    let sum = 0
    let isEven = false

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = Number.parseInt(digits[i])

      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }

      sum += digit
      isEven = !isEven
    }

    return sum % 10 === 0
  }

  processVoiceMessage(audioBlob: Blob): Promise<PIIDetectionResult> {
    return new Promise((resolve) => {
      setTimeout(
        () => {
          const mockTranscripts = [
            "Hi, this is a voice message. My number is 555-123-4567 if you need to reach me.",
            "Hey, can you send the documents to john.doe@company.com? My address is 123 Main Street.",
            "I'll call you from my phone 555-987-6543. My email is jane@example.com for reference.",
            "The meeting is at 456 Oak Avenue. You can reach me at (555) 234-5678.",
            "My SSN is 123-45-6789 for the verification process.",
          ]

          const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
          const result = this.detectPII(randomTranscript)

          result.messageType = "voice"
          result.transcriptionConfidence = 0.85 + Math.random() * 0.1

          resolve(result)
        },
        1500 + Math.random() * 1000,
      )
    })
  }

  private getRedactionText(piiType: string, original: string): string {
    const redactionMap: Record<string, string> = {
      phone_number: "[PHONE REDACTED]",
      email: "[EMAIL REDACTED]",
      ssn: "[SSN REDACTED]",
      credit_card: "[CARD REDACTED]",
      address: "[ADDRESS REDACTED]",
      ip_address: "[IP REDACTED]",
      date_of_birth: "[DOB REDACTED]",
      name_patterns: "[NAME REDACTED]",
      NAME: "[NAME REDACTED]",
      LOCATION: "[LOCATION REDACTED]",
      ORG: "[ORG REDACTED]",
      MISC: "[REDACTED]",
    }
    return redactionMap[piiType] || "[REDACTED]"
  }

  batchDetectPII(messages: string[]): PIIDetectionResult[] {
    return messages.map((message) => this.detectPII(message))
  }

  getPIIStatistics(results: PIIDetectionResult[]): {
    totalMessages: number
    messagesWithPII: number
    piiTypes: Record<string, number>
    redactionRate: number
  } {
    const totalMessages = results.length
    const messagesWithPII = results.filter((r) => r.hasRedactions).length
    const piiTypes: Record<string, number> = {}

    results.forEach((result) => {
      result.detectedFields.forEach((field) => {
        piiTypes[field] = (piiTypes[field] || 0) + 1
      })
    })

    return {
      totalMessages,
      messagesWithPII,
      piiTypes,
      redactionRate: totalMessages > 0 ? messagesWithPII / totalMessages : 0,
    }
  }
}

export const piiDetector = new PIIDetector()