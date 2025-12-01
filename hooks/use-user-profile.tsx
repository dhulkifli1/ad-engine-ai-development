"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

interface UserProfile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  photo_url?: string | null
  role: "Admin" | "User"
}

let globalProfile: UserProfile | null = null
let globalLoading = true
let subscribers: Array<(profile: UserProfile | null, loading: boolean) => void> = []

const notifySubscribers = (profile: UserProfile | null, loading: boolean) => {
  globalProfile = profile
  globalLoading = loading
  subscribers.forEach((callback) => callback(profile, loading))
}

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(globalProfile)
  const [loading, setLoading] = useState(globalLoading)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const callback = (newProfile: UserProfile | null, newLoading: boolean) => {
      setProfile(newProfile)
      setLoading(newLoading)
    }

    subscribers.push(callback)

    return () => {
      subscribers = subscribers.filter((sub) => sub !== callback)
    }
  }, [])

  const fetchProfile = useCallback(async () => {
    if (!user) {
      notifySubscribers(null, false)
      return
    }

    if (!globalProfile) {
      notifySubscribers(null, true)
    }

    console.log("[v0] Profile debug - user:", !!user, "profileLoading:", true)

    try {
      const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (userError && userError.code !== "PGRST116") {
        console.error("[v0] Error fetching user profile:", userError)
      }

      const profileData: UserProfile = userData || {
        id: user.id,
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        email: user.email || "",
        photo_url: user.user_metadata?.avatar_url || null,
        role: "User" as const,
      }

      console.log("[v0] Profile fetched:", profileData)
      notifySubscribers(profileData, false)
    } catch (error) {
      console.error("[v0] Error in fetchProfile:", error)
      const fallbackProfile: UserProfile = {
        id: user.id,
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        email: user.email || "",
        photo_url: user.user_metadata?.avatar_url || null,
        role: "User" as const,
      }
      notifySubscribers(fallbackProfile, false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return { profile, loading, refetch: fetchProfile }
}
