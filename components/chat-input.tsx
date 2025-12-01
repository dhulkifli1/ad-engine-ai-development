"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { ArrowUpIcon, X, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import type { SpeechRecognition } from "./speech-recognition"
import { useAgents } from "@/hooks/use-agents"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const BxSliderAlt = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.55792 4.93333C8.26859 3.97333 7.38659 3.26666 6.33325 3.26666C5.27992 3.26666 4.39792 3.97333 4.10859 4.93333H1.33325V6.26666H4.10859C4.39792 7.22666 5.27992 7.93333 6.33325 7.93333C7.38659 7.93333 8.26859 7.22666 8.55792 6.26666H14.7499V4.93333H8.55792ZM6.33325 6.6C5.78192 6.6 5.33325 6.15133 5.33325 5.6C5.33325 5.04866 5.78192 4.6 6.33325 4.6C6.88459 4.6 7.33325 5.04866 7.33325 5.6C7.33325 6.15133 6.88459 6.6 6.33325 6.6Z"
      fill="#FAFAFA"
    />
    <path
      d="M7.52533 10.5333C7.81467 9.57334 8.69667 8.86667 9.75 8.86667C10.8033 8.86667 11.6853 9.57334 11.9747 10.5333H14.75V11.8667H11.9747C11.6853 12.8267 10.8033 13.5333 9.75 13.5333C8.69667 13.5333 7.81467 12.8267 7.52533 11.8667H1.33333V10.5333H7.52533ZM9.75 12.2C10.3013 12.2 10.75 11.7513 10.75 11.2C10.75 10.6487 10.3013 10.2 9.75 10.2C9.19867 10.2 8.75 10.6487 8.75 11.2C8.75 11.7513 9.19867 12.2 9.75 12.2Z"
      fill="#FAFAFA"
    />
  </svg>
)

const MicrophoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.75 3C8.92969 3 8.25 3.67969 8.25 4.5V13.5C8.25 14.3203 8.92969 15 9.75 15H14.25C15.0703 15 15.75 14.3203 15.75 13.5V4.5C15.75 3.67969 15.0703 3 14.25 3H9.75ZM9.75 4.5H14.25V13.5H9.75V4.5ZM5.25 10.5V13.5C5.25 15.9756 7.27441 18 9.75 18H11.25V19.5H8.25V21H15.75V19.5H12.75V18H14.25C16.7256 18 18.75 15.9756 18.75 13.5V10.5H17.25V13.5C17.25 15.1641 15.9141 16.5 14.25 16.5H9.75C8.08594 16.5 6.75 15.1641 6.75 13.5V10.5H5.25Z"
      fill="#FAFAFA"
    />
  </svg>
)

const PaperclipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15.7502 3C14.7073 3 13.6819 3.4043 12.8909 4.19531L5.85962 11.2266C3.63013 13.4561 3.63013 17.083 5.85962 19.3125C8.08911 21.542 11.7161 21.542 13.9456 19.3125L18.6331 14.625L17.5784 13.5703L12.8909 18.2578C11.2356 19.9131 8.56958 19.9131 6.91431 18.2578C5.25903 16.6025 5.25903 13.9365 6.91431 12.2812L13.9456 5.25C14.9534 4.24219 16.5706 4.24219 17.5784 5.25C18.5862 6.25781 18.5862 7.875 17.5784 8.88281L10.5471 15.9141C10.1868 16.2744 9.61841 16.2744 9.25806 15.9141C8.89771 15.5537 8.89771 14.9854 9.25806 14.625L15.7034 8.17969L14.6487 7.125L8.20337 13.5703C7.2688 14.5049 7.2688 16.0342 8.20337 16.9688C9.13794 17.9033 10.6672 17.9033 11.6018 16.9688L18.6331 9.9375C20.2151 8.35547 20.2151 5.77734 18.6331 4.19531C17.842 3.4043 16.7932 3 15.7502 3Z"
      fill="#FAFAFA"
    />
  </svg>
)

const RecordingAnimation = () => (
  <div className="flex items-center gap-1 text-red-400 animate-pulse">
    <div className="flex items-center gap-1">
      <div className="w-1 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
      <div className="w-1 h-4 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
      <div className="w-1 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      <div className="w-1 h-5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "450ms" }}></div>
      <div className="w-1 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
    </div>
    <span className="text-sm font-medium ml-2">Recording...</span>
  </div>
)

interface AttachmentFile {
  id: string
  file: File
  url: string
  uploading: boolean
  uploaded: boolean
  supabaseUrl?: string
  fileName: string
}

interface ChatInputProps {
  onSendMessage: (message: string, selectedAgent?: string, attachments?: string[], attachmentsNames?: string[]) => void
  isDisabled?: boolean
  currentChat?: any
  selectedAgent?: string
  onAgentChange?: (agent: string) => void
}

const SUPPORTED_FORMATS = {
  images: ["gif", "jpeg", "jpg", "png", "webp"],
  documents: ["doc", "docx", "pdf", "txt", "md", "csv", "xlsx", "pptx"],
  code: ["c", "cpp", "css", "go", "html", "java", "js", "json", "php", "py", "rb", "ts", "tex"],
  archives: ["tar", "zip"],
  other: ["pkl", "xml"],
}

const ALL_SUPPORTED_FORMATS = Object.values(SUPPORTED_FORMATS).flat()

const getSuggestedFormats = (fileExtension: string): { category: string; formats: string[] } => {
  const ext = fileExtension.toLowerCase()

  // Check if it's an image format (even if not supported)
  if (
    ["bmp", "tiff", "tif", "svg", "ico", "heic", "heif", "raw", "cr2", "nef", "orf", "sr2"].includes(ext) ||
    ext.match(/jpe?g|png|gif|webp/)
  ) {
    return { category: "images", formats: SUPPORTED_FORMATS.images }
  }

  // Check if it's a document format
  if (["pages", "odt", "rtf", "epub", "xls", "ppt", "numbers", "key"].includes(ext)) {
    return { category: "documents", formats: SUPPORTED_FORMATS.documents }
  }

  // Check if it's a code file
  if (["jsx", "tsx", "vue", "swift", "kt", "rs", "sh", "yaml", "yml", "toml", "ini"].includes(ext)) {
    return { category: "code files", formats: SUPPORTED_FORMATS.code }
  }

  // Check if it's an archive
  if (["rar", "7z", "gz", "bz2", "xz", "tgz"].includes(ext)) {
    return { category: "archives", formats: SUPPORTED_FORMATS.archives }
  }

  // Check if it's a font file
  if (["ttf", "tff", "otf", "woff", "woff2", "eot"].includes(ext)) {
    return { category: "fonts", formats: ["pdf", "jpg", "jpeg", "png", "txt", "docx"] }
  }

  // Check if it's a video file
  if (["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm", "m4v"].includes(ext)) {
    return { category: "videos", formats: ["pdf", "jpg", "jpeg", "png", "txt", "docx"] }
  }

  // Check if it's an audio file
  if (["mp3", "wav", "ogg", "flac", "aac", "wma", "m4a"].includes(ext)) {
    return { category: "audio files", formats: ["pdf", "jpg", "jpeg", "png", "txt", "docx"] }
  }

  // Check if it's an executable or system file
  if (["exe", "dll", "sys", "bat", "sh", "app", "dmg", "pkg"].includes(ext)) {
    return { category: "executable files", formats: ["pdf", "jpg", "jpeg", "png", "txt", "docx"] }
  }

  // Default to common formats for unknown file types
  return { category: "files", formats: ["pdf", "jpg", "jpeg", "png", "txt", "docx"] }
}

const showToast = (message: string, type: "success" | "error" | "info") => {
  const event = new CustomEvent("showToast", {
    detail: { message, type },
  })
  window.dispatchEvent(event)
}

export function ChatInput({
  onSendMessage,
  isDisabled = false,
  currentChat,
  selectedAgent = "Default Agent",
  onAgentChange,
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [agentSearchQuery, setAgentSearchQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const { agents, loading: agentsLoading } = useAgents()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const agentSearchInputRef = useRef<HTMLInputElement>(null)

  const agentOrder = [
    "Research Agent",
    "Research Organizer Agent 1",
    "Research Organizer Agent 2",
    "Offer Agent 1",
    "Offer Agent 2",
    "Scripting Agent",
    "Static Image Generator Agent",
    "AdGuardian Agent",
    "Congruence Validator",
    "Funnel Leak Detector",
    "AppointWise Setup Agent",
    "Sales Intelligence Agent",
  ]

  const filteredAgents = useMemo(() => {
    if (!agentSearchQuery.trim()) {
      return agents
        .filter((agent) => agent.name !== "Default Agent")
        .sort((a, b) => {
          const indexA = agentOrder.indexOf(a.name)
          const indexB = agentOrder.indexOf(b.name)

          // If both agents are in the order list, sort by their position
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB
          }
          // If only A is in the list, it comes first
          if (indexA !== -1) return -1
          // If only B is in the list, it comes first
          if (indexB !== -1) return 1
          // If neither is in the list, maintain original order
          return 0
        })
    }
    return agents
      .filter(
        (agent) => agent.name !== "Default Agent" && agent.name.toLowerCase().includes(agentSearchQuery.toLowerCase()),
      )
      .sort((a, b) => {
        const indexA = agentOrder.indexOf(a.name)
        const indexB = agentOrder.indexOf(b.name)

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB
        }
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return 0
      })
  }, [agents, agentSearchQuery, agentOrder])

  useEffect(() => {
    if (!agentsLoading && agents.length > 0 && onAgentChange) {
      if (currentChat?.agent_id) {
        const currentAgent = agents.find((agent) => agent.id === currentChat.agent_id)
        if (currentAgent) {
          console.log("[v0] Setting agent from current chat:", currentAgent.name)
          onAgentChange(currentAgent.name)
        } else {
          console.log("[v0] Agent not found for current chat, using Default Agent")
          onAgentChange("Default Agent")
        }
      } else {
        console.log("[v0] No agent in current chat, using Default Agent")
        onAgentChange("Default Agent")
      }
    }
  }, [agents, agentsLoading, currentChat?.agent_id, currentChat?.id, onAgentChange])

  useEffect(() => {
    const focusInput = () => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }

    focusInput()
    const timer = setTimeout(focusInput, 100)
    return () => clearTimeout(timer)
  }, [])

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      const lineHeight = 20
      const maxLines = 5
      const maxHeight = lineHeight * maxLines

      if (scrollHeight <= maxHeight) {
        textarea.style.height = `${scrollHeight}px`
        textarea.style.overflowY = "hidden"
      } else {
        textarea.style.height = `${maxHeight}px`
        textarea.style.overflowY = "auto"
      }
    }
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    adjustTextareaHeight()
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [message])

  const uploadToSupabase = async (file: File): Promise<string> => {
    const supabase = createClient()

    if (!file) {
      throw new Error("No file provided")
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File size must be less than 10MB")
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `chat-attachments/${fileName}`

    console.log("[v0] Uploading file:", { fileName, fileSize: file.size, fileType: file.type })

    const { data, error } = await supabase.storage.from("attachments").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("[v0] Upload error:", error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    console.log("[v0] Upload successful:", data)

    const {
      data: { publicUrl },
    } = supabase.storage.from("attachments").getPublicUrl(filePath)

    console.log("[v0] Public URL generated:", publicUrl)
    return publicUrl
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setIsUploadingFiles(false)
      return
    }

    console.log("[v0] Files selected:", files.length)

    const invalidFiles: { name: string; extension: string }[] = []
    const validFiles: File[] = []

    Array.from(files).forEach((file) => {
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || ""
      console.log("[v0] Checking file:", file.name, "Extension:", fileExtension)

      if (!ALL_SUPPORTED_FORMATS.includes(fileExtension)) {
        console.log("[v0] File rejected - unsupported format:", file.name)
        invalidFiles.push({ name: file.name, extension: fileExtension })
      } else {
        console.log("[v0] File accepted:", file.name)
        validFiles.push(file)
      }
    })

    if (invalidFiles.length > 0) {
      setIsUploadingFiles(false)

      invalidFiles.forEach(({ name, extension }) => {
        const { category, formats } = getSuggestedFormats(extension)
        const formattedFormats = formats.map((f) => `.${f}`).join(", ")

        showToast(
          `"${name}" is not a supported format.${category !== "files" ? `\n\nFor ${category}, try` : "\n\nTry"}: ${formattedFormats}`,
          "error",
        )
      })

      // If no valid files, return early
      if (validFiles.length === 0) {
        return
      }
    }

    const newAttachments: AttachmentFile[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(2),
      file,
      url: URL.createObjectURL(file),
      uploading: true,
      uploaded: false,
      fileName: file.name,
    }))

    setAttachments((prev) => [...prev, ...newAttachments])

    for (const attachment of newAttachments) {
      try {
        console.log("[v0] Starting upload for:", attachment.file.name)
        const supabaseUrl = await uploadToSupabase(attachment.file)
        console.log("[v0] Upload completed for:", attachment.file.name)

        setAttachments((prev) =>
          prev.map((att) =>
            att.id === attachment.id ? { ...att, uploading: false, uploaded: true, supabaseUrl } : att,
          ),
        )
        showToast("File uploaded successfully", "success")
      } catch (error) {
        console.error("[v0] Upload failed for:", attachment.file.name, error)
        setAttachments((prev) =>
          prev.map((att) => (att.id === attachment.id ? { ...att, uploading: false, uploaded: false } : att)),
        )
        showToast(
          `Upload failed for ${attachment.file.name}. Please try again. If the issue persists, contact support.`,
          "error",
        )
      }
    }

    setIsUploadingFiles(false)
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((att) => att.id === id)
      if (attachment) {
        URL.revokeObjectURL(attachment.url)
      }
      return prev.filter((att) => att.id !== id)
    })
  }

  const handleUploadFromComputer = () => {
    setIsUploadingFiles(true)

    const handleFocus = () => {
      // Small delay to ensure file input has been updated
      setTimeout(() => {
        if (!fileInputRef.current?.files || fileInputRef.current.files.length === 0) {
          setIsUploadingFiles(false)
        }
      }, 100)
      window.removeEventListener("focus", handleFocus)
    }

    window.addEventListener("focus", handleFocus)
    fileInputRef.current?.click()
  }

  const handleTakePhoto = () => {
    cameraInputRef.current?.click()
  }

  useEffect(() => {
    if (dropdownOpen && agentSearchInputRef.current) {
      setTimeout(() => {
        agentSearchInputRef.current?.focus()
      }, 100)
    }
  }, [dropdownOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((message.trim() || attachments.length > 0) && !isDisabled) {
      const uploadedAttachments = attachments
        .filter((att) => att.uploaded && att.supabaseUrl)
        .map((att) => att.supabaseUrl!)

      const attachmentNames = attachments.filter((att) => att.uploaded && att.supabaseUrl).map((att) => att.fileName)

      onSendMessage(message.trim(), selectedAgent, uploadedAttachments, attachmentNames)
      setMessage("")
      setAttachments([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isDisabled) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognitionInstance = new SpeechRecognition()

        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = "en-US"

        recognitionInstance.onresult = (event) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          if (finalTranscript) {
            setMessage((prev) => prev + finalTranscript + " ")
          }
        }

        recognitionInstance.onerror = (event) => {
          console.error("[v0] Speech recognition error:", event.error)
          setIsRecording(false)
          showToast(`Speech recognition error: ${event.error}`, "error")
        }

        recognitionInstance.onend = () => {
          setIsRecording(false)
        }

        setRecognition(recognitionInstance)
      } catch (error) {
        console.error("[v0] Error initializing speech recognition:", error)
      }
    }
  }, [])

  const startRecording = () => {
    if (!recognition) {
      showToast("Speech recognition is not supported in this browser", "error")
      return
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) {
        throw new Error("AudioContext not supported")
      }

      const audioContext = new AudioContextClass()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)

      recognition.start()
      setIsRecording(true)
      showToast("Recording started. Speak now...", "success")
    } catch (error) {
      console.error("[v0] Error starting recording:", error)
      showToast("Failed to start recording", "error")
    }
  }

  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop()
      setIsRecording(false)
      showToast("Recording stopped", "success")
    }
  }

  const handleMicrophoneClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  useEffect(() => {
    const handleSuggestionClick = (suggestion: string) => {
      console.log("[v0] ChatInput handler called with:", suggestion)
      console.log("[v0] Current message state:", message)
      console.log("[v0] isDisabled:", isDisabled)
      console.log("[v0] attachments:", attachments)

      setMessage(suggestion)
      setTimeout(() => {
        console.log("[v0] About to send message:", suggestion)
        if (suggestion.trim() && !isDisabled) {
          const uploadedAttachments = attachments
            .filter((att) => att.uploaded && att.supabaseUrl)
            .map((att) => att.supabaseUrl!)

          const attachmentNames = attachments
            .filter((att) => att.uploaded && att.supabaseUrl)
            .map((att) => att.fileName)

          console.log("[v0] Calling onSendMessage with:", {
            suggestion,
            selectedAgent,
            uploadedAttachments,
            attachmentNames,
          })
          onSendMessage(suggestion.trim(), selectedAgent, uploadedAttachments, attachmentNames)
          setMessage("")
          setAttachments([])
        } else {
          console.log("[v0] Not sending - suggestion empty or disabled")
        }
      }, 50)
    }
    ;(window as any).__chatInputSuggestionHandler = handleSuggestionClick

    return () => {
      delete (window as any).__chatInputSuggestionHandler
    }
  }, [selectedAgent, attachments, isDisabled, onSendMessage])

  return (
    <div className="w-full relative z-60">
      <form onSubmit={handleSubmit}>
        <div
          className={`backdrop-blur-xl bg-black/40 rounded-xl p-4 transition-all duration-300 ${
            isFocused ? "border border-[#3E3E3E]" : "border border-[#3E3E3E]"
          } ${isDisabled ? "opacity-60" : ""} ${isRecording ? "border-red-400/50 bg-red-400/5" : ""}`}
        >
          <div className="flex flex-col gap-3">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2 border-b border-white/10">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="relative group">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#2a2a2a] border border-white/10 flex items-center justify-center">
                      {attachment.file.type.startsWith("image/") ? (
                        <img
                          src={attachment.url || "/placeholder.svg"}
                          alt="Attachment"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-xs text-gray-400 text-center p-1">
                          {attachment.file.name.split(".").pop()?.toUpperCase()}
                        </div>
                      )}

                      {attachment.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        </div>
                      )}

                      {attachment.uploaded && (
                        <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full" />
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {isRecording && (
              <div className="pb-2 border-b border-red-400/20">
                <RecordingAnimation />
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                isRecording
                  ? "Listening... speak now"
                  : isDisabled
                    ? "Please wait for AI response..."
                    : "Ask anything about paid ads"
              }
              disabled={isDisabled}
              className={`w-full min-h-[20px] max-h-32 resize-none bg-transparent border-0 text-white focus:ring-0 focus:outline-none p-0 text-sm leading-5 font-sans focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-custom disabled:opacity-100 transition-all duration-300 ${
                isRecording ? "placeholder-red-400/70" : "placeholder-[#B1B1B1]"
              }`}
              rows={1}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 relative">
                {currentChat && currentChat.messages && currentChat.messages.length > 0 ? (
                  <div className="text-gray-300 px-3 h-8 text-sm rounded-lg bg-[#2a2a2a] border border-white/10 flex items-center gap-2 min-w-[120px]">
                    {agentsLoading ? (
                      <div className="flex items-center justify-center w-full">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : (
                      <span>{selectedAgent || "Default Agent"}</span>
                    )}
                  </div>
                ) : (
                  <Select
                    value={selectedAgent}
                    onValueChange={(value) => onAgentChange?.(value)}
                    disabled={isDisabled || agentsLoading}
                    onOpenChange={(open) => {
                      setDropdownOpen(open)
                      if (!open) {
                        setAgentSearchQuery("")
                      }
                    }}
                  >
                    <SelectTrigger className="text-gray-300 px-3 h-8 text-sm rounded-lg bg-[#2a2a2a] border border-white/10 flex items-center gap-2 hover:bg-[#333333] transition-colors min-w-[120px]">
                      {agentsLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <SelectValue placeholder="Default Agent" />
                      )}
                    </SelectTrigger>
                    <SelectContent
                      side="bottom"
                      align="start"
                      className="bg-[#2a2a2a] border border-white/10 text-white p-0"
                    >
                      <div className="sticky top-0 bg-[#2a2a2a] p-2 z-20">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-[#3E3E3E]" />
                          <input
                            ref={agentSearchInputRef}
                            type="text"
                            placeholder="Search Agents"
                            value={agentSearchQuery}
                            onChange={(e) => setAgentSearchQuery(e.target.value)}
                            className="w-full pl-7 pr-7 py-1.5 text-sm bg-transparent border border-[#3E3E3E] rounded text-white placeholder-[#3E3E3E] focus:outline-none focus:border-[#3E3E3E]"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          {agentSearchQuery && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setAgentSearchQuery("")
                                agentSearchInputRef.current?.focus()
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#3E3E3E] hover:text-white transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto p-1 scrollbar-custom">
                        <SelectItem key="default" value="Default Agent" className="hover:bg-white/10 focus:bg-white/10">
                          Default Agent
                        </SelectItem>
                        <div className="h-px bg-white/10 my-1" />
                        {filteredAgents
                          .filter((agent, index, self) => index === self.findIndex((a) => a.name === agent.name))
                          .map((agent) => (
                            <SelectItem
                              key={agent.id}
                              value={agent.name}
                              className="hover:bg-white/10 focus:bg-white/10"
                            >
                              {agent.name}
                            </SelectItem>
                          ))}
                        {agentSearchQuery.trim() && filteredAgents.length === 0 && (
                          <div className="px-2 py-4 text-center text-sm text-[#777777]">No agents found</div>
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isDisabled}
                  onClick={handleMicrophoneClick}
                  className={`p-2 h-8 w-8 rounded-lg transition-all duration-300 disabled:opacity-50 relative overflow-hidden ${
                    isRecording
                      ? "text-red-400 bg-red-400/20 hover:bg-red-400/30 shadow-lg shadow-red-400/20"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                  title={isRecording ? "Stop recording" : "Start voice recording"}
                >
                  <MicrophoneIcon />
                  {isRecording && <div className="absolute inset-0 bg-red-400/10 animate-ping rounded-lg"></div>}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleUploadFromComputer}
                  disabled={isDisabled || isUploadingFiles}
                  className="text-gray-300 hover:text-white hover:bg-white/10 p-2 h-8 w-8 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {isUploadingFiles ? (
                    <div className="flex items-center justify-center w-full">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    </div>
                  ) : (
                    <PaperclipIcon />
                  )}
                </Button>

                <Button
                  type="submit"
                  disabled={
                    (!message.trim() && attachments.length === 0) ||
                    isDisabled ||
                    attachments.some((att) => att.uploading)
                  }
                  className={`p-2 h-8 w-8 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg ml-1 ${
                    (message.trim() || attachments.length > 0) &&
                    !isDisabled &&
                    !attachments.some((att) => att.uploading)
                      ? "bg-[#CCAE7C] hover:bg-[#b8991f] text-black"
                      : "bg-gray-600 text-gray-400"
                  }`}
                >
                  <ArrowUpIcon className="w-4 h-4 font-bold" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  )
}
