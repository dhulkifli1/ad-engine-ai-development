"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      console.log("[Login] Starting login process for:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[Login] Login response:", { data, error })

      if (error) throw error

      console.log("[Login] Login successful, user:", data.user?.email)

      if (data.user?.id) {
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("first_sign_in, is_active")
          .eq("id", data.user.id)
          .single()

        console.log("[Login] User profile:", userProfile)

        if (!profileError && userProfile?.is_active === false) {
          console.log("[Login] User is suspended, signing out")
          await supabase.auth.signOut()
          setError("Your account has been suspended")
          setIsLoading(false)
          return
        }

        if (!profileError && userProfile?.first_sign_in === true) {
          console.log("[Login] First sign in detected, redirecting to change password")
          router.replace(`/auth/change-password?userId=${data.user.id}`)
          return
        }
      }

      router.replace("/")
    } catch (error: unknown) {
      console.log("[Login] Login error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: "google" | "github") => {
    const supabase = createClient()

    try {
      console.log(`[Login] Starting ${provider} OAuth login`)

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          ...(provider === "google" && {
            scopes: "https://www.googleapis.com/auth/userinfo.email",
          }),
        },
      })

      if (error) {
        console.error(`[Login] ${provider} OAuth error:`, error)
        throw error
      }

      console.log(`[Login] ${provider} OAuth initiated successfully`)
    } catch (error: unknown) {
      console.error(`[Login] ${provider} OAuth failed:`, error)
      setError(error instanceof Error ? error.message : `An error occurred with ${provider} login`)
    }
  }

  return (
    <div className="flex h-screen text-white overflow-hidden relative">
      <div className="absolute inset-0">
        <img
          src="/images/design-mode/Mono-Glass2%201.png%281%29%281%29.jpeg"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#111111]/60 backdrop-blur-[6px]"></div>
        <div className="absolute inset-0 bg-[#171717]/40 backdrop-blur-[8px]"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center w-full">
        <div className="w-full max-w-md p-8 bg-[#2a2a2a]/30 backdrop-blur-[8px] rounded-xl border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Welcome back</h1>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                ref={emailInputRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <Link href="/auth/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-md">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            
            
          </div>
        </div>
      </div>
    </div>
  )
}
