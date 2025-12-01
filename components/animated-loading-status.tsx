"use client"

import { useState, useEffect } from "react"

const defaultLoadingMessages = [
  "Thinking",
  "Processing your request",
  "Analyzing context",
  "Searching knowledge base",
  "Extracting relevant information",
  "Generating response",
  "Finalizing answer",
]

const getAttachmentLoadingMessages = (attachments: string[] = []) => {
  if (attachments.length === 0) return defaultLoadingMessages

  const hasImages = attachments.some(
    (url) =>
      url.toLowerCase().includes(".jpg") ||
      url.toLowerCase().includes(".jpeg") ||
      url.toLowerCase().includes(".png") ||
      url.toLowerCase().includes(".gif") ||
      url.toLowerCase().includes(".webp"),
  )

  const hasDocuments = attachments.some(
    (url) =>
      url.toLowerCase().includes(".pdf") ||
      url.toLowerCase().includes(".doc") ||
      url.toLowerCase().includes(".txt") ||
      url.toLowerCase().includes(".csv"),
  )

  if (hasImages && hasDocuments) {
    return [
      "Checking the images and documents",
      "Analyzing visual content",
      "Processing document text",
      "Extracting key information",
      "Generating comprehensive response",
      "Finalizing analysis",
    ]
  } else if (hasImages) {
    return [
      "Checking the image",
      "Analyzing visual content",
      "Processing image details",
      "Understanding context",
      "Generating response",
      "Finalizing analysis",
    ]
  } else if (hasDocuments) {
    return [
      "Checking the document",
      "Processing file content",
      "Extracting text information",
      "Analyzing document structure",
      "Generating response",
      "Finalizing analysis",
    ]
  } else {
    return [
      "Checking the file",
      "Processing attachment",
      "Analyzing content",
      "Extracting information",
      "Generating response",
      "Finalizing analysis",
    ]
  }
}

interface AnimatedLoadingStatusProps {
  isVisible: boolean
  attachments?: string[]
}

export function AnimatedLoadingStatus({ isVisible, attachments = [] }: AnimatedLoadingStatusProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  const loadingMessages = getAttachmentLoadingMessages(attachments)

  useEffect(() => {
    if (!isVisible) {
      setCurrentMessageIndex(0)
      return
    }

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 3000) // Faster message rotation for better UX

    return () => {
      clearInterval(messageInterval)
    }
  }, [isVisible, loadingMessages.length])

  if (!isVisible) return null

  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-[#202020] border border-white/5 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="relative overflow-hidden">
            <div
              className="text-sm text-white animate-pulse"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2s infinite linear",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {loadingMessages[currentMessageIndex]}...
            </div>
            <div className="absolute inset-0 text-sm text-white/60">{loadingMessages[currentMessageIndex]}...</div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}
