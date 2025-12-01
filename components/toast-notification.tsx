"use client"

import { useEffect, useState } from "react"
import { X, AlertCircle, CheckCircle, Info } from "lucide-react"

interface ToastData {
  message: string
  type: "success" | "error" | "info"
}

export function ToastNotification() {
  const [toast, setToast] = useState<ToastData | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleToast = (event: CustomEvent<ToastData>) => {
      setToast(event.detail)
      setIsVisible(true)

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => setToast(null), 300) // Wait for fade out animation
      }, 5000)
    }

    window.addEventListener("showToast", handleToast as EventListener)

    return () => {
      window.removeEventListener("showToast", handleToast as EventListener)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => setToast(null), 300)
  }

  if (!toast) return null

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case "info":
        return <Info className="w-5 h-5 text-blue-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case "success":
        return "border-green-400/20"
      case "error":
        return "border-red-400/20"
      case "info":
        return "border-blue-400/20"
      default:
        return "border-blue-400/20"
    }
  }

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] max-w-md transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div className={`bg-[#2a2a2a]/95 backdrop-blur-[20px] border ${getBorderColor()} rounded-lg p-4 shadow-lg`}>
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white whitespace-pre-wrap break-words">{toast.message}</p>
          </div>
          <button onClick={handleClose} className="flex-shrink-0 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
