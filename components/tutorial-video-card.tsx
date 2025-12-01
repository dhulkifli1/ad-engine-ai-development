"use client"

import type React from "react"

import { Play, ChevronUp, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"

export function TutorialVideoCard() {
  const [isMinimized, setIsMinimized] = useState(false)

  // Load minimized state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("tutorialCardMinimized")
    if (savedState !== null) {
      setIsMinimized(savedState === "true")
    }
  }, [])

  // Save minimized state to localStorage whenever it changes
  const toggleMinimized = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newState = !isMinimized
    setIsMinimized(newState)
    localStorage.setItem("tutorialCardMinimized", String(newState))
  }

  const handleClick = () => {
    window.open("https://www.loom.com/share/c6a468c3f0a84436b28aa1880660ebb7", "_blank")
  }

  if (isMinimized) {
    return (
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer group hover:bg-[#222222]">
          <div onClick={handleClick} className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded bg-black/50 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-white font-medium text-sm">Tutorial</span>
          </div>
          <button
            onClick={toggleMinimized}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Expand tutorial"
          >
            <ChevronUp className="w-4 h-4 text-[#B1B1B1] group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden transition-all duration-300">
      {/* Video Thumbnail */}
      <div
        onClick={handleClick}
        className="relative h-24 bg-black flex items-center justify-center overflow-hidden cursor-pointer group"
      >
        <img src="/images/screenshot-20-28221-29.png" alt="Tutorial thumbnail" className="w-full h-full object-cover" />
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 text-black fill-black ml-0.5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-medium text-sm">Tutorial</h3>
          <button
            onClick={toggleMinimized}
            className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
            aria-label="Minimize tutorial"
          >
            <ChevronDown className="w-4 h-4 text-[#B1B1B1] hover:text-white transition-colors" />
          </button>
        </div>
        <p className="text-[#B1B1B1] text-xs leading-relaxed">
          New to AdEngine AI? Here's a detailed tutorial on how to make the best use of this software.
        </p>
        <button
          onClick={handleClick}
          className="w-full bg-white/10 hover:bg-white/20 text-white text-xs py-1.5 rounded transition-colors border border-white/20"
        >
          Access
        </button>
      </div>
    </div>
  )
}
