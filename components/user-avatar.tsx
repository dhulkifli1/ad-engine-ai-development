"use client"

import { useUserProfile } from "@/hooks/use-user-profile"
import { getInitials, getThemeColor } from "@/lib/utils/time"

interface UserAvatarProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function UserAvatar({ size = "md", className = "" }: UserAvatarProps) {
  const { profile, loading } = useUserProfile()

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-12 h-12 text-lg",
    xl: "w-24 h-24 text-2xl",
  }

  if (loading) {
    return <div className={`${sizeClasses[size]} rounded-full bg-gray-500 animate-pulse ${className}`} />
  }

  if (profile?.photo_url) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
        <img
          src={profile.photo_url || "/placeholder.svg"}
          alt={`${profile.first_name || "User"} avatar`}
          className="w-full h-full object-cover"
          key={profile.photo_url}
          onError={(e) => {
            console.log("[v0] Avatar image failed to load:", profile.photo_url)
            e.currentTarget.style.display = "none"
          }}
        />
      </div>
    )
  }

  const initials = getInitials(profile?.first_name || undefined, profile?.last_name || undefined)
  const bgColor = getThemeColor(profile?.first_name || profile?.email)

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${bgColor} flex items-center justify-center text-white font-medium ${className}`}
    >
      {initials}
    </div>
  )
}
