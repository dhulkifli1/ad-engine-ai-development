"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ChangePasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (passwordInputRef.current) {
      passwordInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setError("Invalid access. Please sign in again.")
    }
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!userId) {
      setError("User ID is missing. Please sign in again.")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      console.log("[ChangePassword] Starting password change process for user:", userId)

      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          password: password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update password")
      }

      console.log("[ChangePassword] Password updated successfully")
      const webhookUrl =
        process.env.NEXT_PUBLIC_ENVIRONMENT === "sandbox"
          ? "https://paidadvertising.app.n8n.cloud/webhook/1ef91f1d-a9c5-4a9a-9f15-af3d7da05921"
          : "https://paidadvertising.app.n8n.cloud/webhook/28ed9bd7-6649-4111-8d58-716704024c94";

      try {
        const webhookResponse = await fetch(
          webhookUrl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
            }),
          },
        )

        console.log("[ChangePassword] Webhook response:", webhookResponse.status)
      } catch (webhookError) {
        console.error("[ChangePassword] Webhook error:", webhookError)
      }

      setIsSuccess(true)
    } catch (error: unknown) {
      console.error("[ChangePassword] Error:", error)
      setError(error instanceof Error ? error.message : "An error occurred while changing password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.replace("/auth/login")
  }

  if (!userId) {
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
          <div className="w-full max-w-md p-8 bg-[#2a2a2a]/30 backdrop-blur-[8px] rounded-xl border border-white/10 text-center">
            <h1 className="text-2xl font-semibold text-white mb-4">Invalid Access</h1>
            <p className="text-gray-400 mb-6">This page requires valid authentication. Please sign in again.</p>

            <Button
              onClick={handleBackToLogin}
              className="w-full bg-white text-black hover:bg-gray-200 transition-colors"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
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
          <div className="w-full max-w-md p-8 bg-[#2a2a2a]/30 backdrop-blur-[8px] rounded-xl border border-white/10 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-semibold text-white mb-4">Password Changed Successfully!</h1>
            <p className="text-gray-400 mb-6">
              Your password has been updated. Please sign in with your new credentials.
            </p>

            <Button
              onClick={handleBackToLogin}
              className="w-full bg-white text-black hover:bg-gray-200 transition-colors"
            >
              Proceed to Login
            </Button>
          </div>
        </div>
      </div>
    )
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
            <h1 className="text-2xl font-semibold text-white mb-2">Change Your Password</h1>
            <p className="text-gray-400">Please set a new password for your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                New Password
              </Label>
              <Input
                ref={passwordInputRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                placeholder="Enter your new password"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                placeholder="Confirm your new password"
                required
                disabled={isLoading}
                minLength={6}
              />
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
              {isLoading ? "Changing Password..." : "Change Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
