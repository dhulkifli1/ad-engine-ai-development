"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ChatInput } from "./chat-input"
import { AnimatedLoadingStatus } from "./animated-loading-status"
import { MarkdownMessage } from "./markdown-message"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getTimeBasedGreeting } from "@/lib/utils/time"
import type { Chat } from "@/hooks/use-chats"
import { Paperclip, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatAreaProps {
  chat?: Chat
  onSendMessage: (message: string, selectedAgent?: string, attachments?: string[], attachmentsNames?: string[]) => void
  isBottomSheetOpen?: boolean
  isAiResponding?: boolean
  selectedBrand?: string | null
  brands?: any[]
  currentChat?: Chat // Added currentChat prop to pass to ChatInput
  selectedAgent?: string
  onAgentChange?: (agent: string) => void
  onSuggestionClick?: (suggestion: string) => void
}

export function ChatArea({
  chat,
  onSendMessage,
  isBottomSheetOpen,
  isAiResponding = false,
  selectedBrand,
  brands,
  currentChat,
  selectedAgent = "Default Agent",
  onAgentChange,
  onSuggestionClick,
}: ChatAreaProps) {
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false)
  const [showLoadingBox, setShowLoadingBox] = useState(false)
  const [lastSentAttachments, setLastSentAttachments] = useState<string[]>([]) // Track last sent attachments for smart thinking text
  const [isDragging, setIsDragging] = useState(false) // Added state to track drag and drop attempts
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)
  const { profile, loading } = useUserProfile()
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  const chatSuggestions: Record<string, string> = {
    "Default Agent": "Help me with ads",
    "AdGuardian Agent": "Help me check my ad compliance",
    "AppointWise Setup Agent": "Help me with my appointments",
    "Congruence Validator": "Help me check if my ad matches my market",
    "Funnel Leak Detector": "Help me identify leaks in my funnel",
    "Offer Agent 1": "Help me with my offer",
    "Offer Agent 2": "Help me with my offer",
    "Research Agent": "Help me research",
    "Research Organizer Agent 1": "Help me organize my research",
    "Research Organizer Agent 2": "Help me organize my research",
    "Sales Intelligence Agent": " Help me with my sales",
    "Scripting Agent": "Help me with scripting",
    "Static Image Generator Agent": "Help me with my statics",
  }

  const currentSuggestion = chatSuggestions[selectedAgent] || chatSuggestions["Default Agent"]

  const scrollToMessage = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start", // Always scroll to start for better UX
      })
    }
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      })
    }
  }

  const getBrandName = (brandId: string | null) => {
    if (!brandId || !brands) return null
    const brand = brands.find((b) => b.id === brandId)
    console.log("[v0] getBrandName - brandId:", brandId, "brands:", brands)
    return brand?.name || null
  }

  const brandName = selectedBrand ? getBrandName(selectedBrand) : null
  const greeting = loading ? null : brandName || getTimeBasedGreeting(profile?.first_name || undefined)

  console.log(
    "[v0] ChatArea greeting debug - selectedBrand:",
    selectedBrand,
    "brandName:",
    brandName,
    "greeting:",
    greeting,
  )

  const handleSendMessage = (
    message: string,
    selectedAgent?: string,
    attachments?: string[],
    attachmentsNames?: string[],
  ) => {
    if (!isAiResponding) {
      setLastSentAttachments(attachments || [])
      // Scroll to bottom immediately when user sends message
      setTimeout(() => scrollToBottom(), 50)
      onSendMessage(message, selectedAgent, attachments, attachmentsNames)
    }
  }

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)

      // Show toast notification
      const event = new CustomEvent("showToast", {
        detail: { message: "Message copied to clipboard", type: "success" },
      })
      window.dispatchEvent(event)

      // Reset icon after 3 seconds
      setTimeout(() => {
        setCopiedMessageId(null)
      }, 3000)
    } catch (error) {
      console.error("[v0] Failed to copy message:", error)
      const event = new CustomEvent("showToast", {
        detail: { message: "Failed to copy message", type: "error" },
      })
      window.dispatchEvent(event)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only hide overlay if leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    // Show toast notification
    const event = new CustomEvent("showToast", {
      detail: {
        message: "Drag and drop is not supported",
        type: "info",
      },
    })
    window.dispatchEvent(event)
  }

  useEffect(() => {
    if (!isAiResponding && chat?.messages && chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1]
      if (lastMessage.role === "assistant") {
        setTimeout(() => {
          const textarea = document.querySelector('textarea[placeholder*="Ask anything"]') as HTMLTextAreaElement | null
          if (textarea) {
            textarea.focus()
          }
        }, 100)
      }
    }
  }, [isAiResponding, chat?.messages])

  useEffect(() => {
    if (isAiResponding) {
      const timer = setTimeout(() => {
        setShowLoadingBox(true)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setShowLoadingBox(false)
    }
  }, [isAiResponding])

  useEffect(() => {
    if (chat?.messages && chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1]

      // Scroll to bottom when:
      // 1. Chat first loads (initial load)
      // 2. User sends message
      // 3. Thinking box appears (showLoadingBox is true)
      // Don't scroll when AI responds (isAiResponding is false and last message is assistant)

      if (showLoadingBox) {
        // When thinking box appears, scroll to bottom
        setTimeout(() => scrollToBottom(), 100)
      } else if (lastMessage.role === "user") {
        // When user sends message, scroll to bottom
        setTimeout(() => scrollToBottom(), 100)
      } else if (lastMessage.role === "assistant" && isAiResponding) {
        // Don't scroll when AI is responding - user stays where they are reading
        return
      }
    }
  }, [chat?.messages, showLoadingBox, isAiResponding])

  useEffect(() => {
    // When chat first loads, scroll to bottom
    if (chat?.messages && chat.messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [chat?.id])

  useEffect(() => {
    const handleBottomSheetExpansion = (event: CustomEvent) => {
      setIsBottomSheetExpanded(event.detail.isExpanded)
    }

    window.addEventListener("bottomSheetExpansion", handleBottomSheetExpansion as EventListener)
    return () => {
      window.removeEventListener("bottomSheetExpansion", handleBottomSheetExpansion as EventListener)
    }
  }, [])

  useEffect(() => {
    const focusInput = () => {
      const textarea = document.querySelector('textarea[placeholder*="Ask anything"]') as HTMLTextAreaElement | null
      if (textarea) {
        textarea.focus()
      }
    }

    const timer = setTimeout(focusInput, 100)
    return () => clearTimeout(timer)
  }, [chat?.id])

  if (!chat || chat.messages.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col bg-transparent relative h-full"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-not-allowed">
            <div className="bg-[#2a2a2a] border-2 border-dashed border-white/30 rounded-2xl p-8 max-w-md mx-4">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <Paperclip className="w-8 h-8 text-white/70" />
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-2">Drag and drop is not supported</h3>
                  <p className="text-white/70 text-sm">Please select files from the dialog</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="absolute top-6 left-6"></div>

        <div
          className="flex flex-col items-center justify-center flex-1"
          style={{
            paddingBottom: isBottomSheetOpen ? (isBottomSheetExpanded ? "380px" : "220px") : "0px",
            transition: "padding-bottom 0.3s ease-in-out",
          }}
        >
          {!loading && greeting && (
            <h1 className="font-semibold font-sans tracking-tight mb-6 text-[#FAFAFA]" style={{ fontSize: "48px" }}>
              {greeting}
            </h1>
          )}
          <div className="w-fit mx-auto px-6 mb-4">
            <button
              onClick={() => {
                console.log("[v0] Suggestion clicked:", currentSuggestion)
                onSuggestionClick?.(currentSuggestion)
              }}
              className="bg-[#2a2a2a]/40 border border-white/10 rounded-lg px-4 py-3 text-center hover:bg-[#2a2a2a]/60 transition-colors cursor-pointer"
            >
              <p className="text-[#B1B1B1] text-sm leading-relaxed">{currentSuggestion}</p>
            </button>
          </div>
          <div className="max-w-3xl w-full px-6">
            <ChatInput
              onSendMessage={handleSendMessage}
              isDisabled={isAiResponding}
              currentChat={currentChat}
              selectedAgent={selectedAgent}
              onAgentChange={onAgentChange}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex-1 flex flex-col bg-transparent h-full relative"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-not-allowed">
          <div className="bg-[#2a2a2a] border-2 border-dashed border-white/30 rounded-2xl p-8 max-w-md mx-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <Paperclip className="w-8 h-8 text-white/70" />
              </div>
              <div>
                <h3 className="text-white text-lg font-semibold mb-2">Drag and drop is not supported</h3>
                <p className="text-white/70 text-sm">Please select files from the dialog</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-custom px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {chat.messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              ref={index === chat.messages.length - 1 ? lastMessageRef : null}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg font-sans ${
                  message.role === "user" ? "bg-[#3e3e3e] text-white" : "bg-[#202020] text-white border border-white/5"
                }`}
              >
                {message.role === "assistant" ? (
                  <MarkdownMessage content={message.content} />
                ) : (
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap overflow-wrap-anywhere">
                    {message.content}
                  </p>
                )}

                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1 mb-2 text-xs text-white/70">
                      <Paperclip className="w-3 h-3" />
                      <span className="font-medium">
                        {message.attachments.length} attachment{message.attachments.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="text-xs text-white/60">
                      {message.attachments.map((attachmentUrl, idx) => {
                        const attachmentName = message.attachments_names?.[idx] || `attachment-${idx + 1}`
                        return (
                          <span key={idx}>
                            {idx > 0 && ", "}
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#CCAE7C] hover:text-[#b8991f] hover:underline"
                              title={attachmentName}
                            >
                              {attachmentName}
                            </a>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {message.role === "assistant" && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <div className="text-xs opacity-50 font-sans">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleCopyMessage(message.id, message.content)}
                      className="text-gray-300 hover:text-white hover:bg-white/10 p-2 h-8 w-8 rounded-lg transition-all duration-200"
                      title="Copy message"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}

                {message.role === "user" && (
                  <div className="text-xs opacity-50 mt-2 font-sans">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          <AnimatedLoadingStatus isVisible={showLoadingBox} attachments={lastSentAttachments} />

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div
        className="p-6"
        style={{
          paddingBottom: isBottomSheetOpen ? (isBottomSheetExpanded ? "380px" : "220px") : "24px",
          transition: "padding-bottom 0.3s ease-in-out",
        }}
      >
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            isDisabled={isAiResponding}
            currentChat={currentChat}
            selectedAgent={selectedAgent}
            onAgentChange={onAgentChange}
          />
        </div>
      </div>
    </div>
  )
}
