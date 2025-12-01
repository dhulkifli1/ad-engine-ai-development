"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/ssr"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

const supabase = createClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized.current) return
    initialized.current = true

    const initializeAuth = async () => {
      try {
        console.log("[v0] Auth: Initializing auth...")
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        console.log("[v0] Auth: Session data:", session)
        console.log("[v0] Auth: Session error:", error)

        if (error) {
          console.error("[Auth] Session error:", error)
          if (mounted.current) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (mounted.current) {
          console.log("[v0] Auth: Setting user:", session?.user ?? null)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error("[Auth] Initialization error:", error)
        if (mounted.current) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[v0] Auth: State change event:", event, "Session:", session)
      if (!mounted.current) return

      // Update user state for all events except INITIAL_SESSION
      if (event !== "INITIAL_SESSION") {
        console.log("[v0] Auth: Updating user from state change:", session?.user ?? null)
        setUser(session?.user ?? null)
      }

      // Always set loading to false after any auth event
      setLoading(false)
    })

    // Cleanup function
    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [])

  // Track mounted state
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const signOut = async () => {
    try {
      console.log("[v0] Auth: Starting sign out process")

      setUser(null)
      setLoading(false)

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("[v0] Auth: Sign out error:", error)
      }

      window.location.replace("/auth/login")
    } catch (error) {
      console.error("[Auth] Sign out error:", error)
      // Still redirect even if there's an error
      window.location.replace("/auth/login")
    }
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
