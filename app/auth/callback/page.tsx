"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()

      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("[Auth Callback] Error:", error)
          router.replace("/auth/login?error=" + encodeURIComponent(error.message))
          return
        }

        if (data.session) {
          console.log("[Auth Callback] Session found for user:", data.session.user.email)

          const type = searchParams.get('type')
          if (type === 'recovery') {
            console.log("[Auth Callback] Password recovery detected, redirecting to reset password")
            router.replace("/auth/reset-password")
            return
          }

          const { data: existingUser, error: userError } = await supabase
            .from("users")
            .select("id, email, first_sign_in, is_active")
            .eq("email", data.session.user.email)
            .single()

          if (userError || !existingUser) {
            console.log("[Auth Callback] User not found in database, signing out")
            await supabase.auth.signOut()
            router.replace(
              "/auth/login?error=" +
                encodeURIComponent("Account not found. Please contact an administrator to create your account."),
            )
            return
          }

          if (existingUser.is_active === false) {
            console.log("[Auth Callback] User is suspended, signing out")
            await supabase.auth.signOut()
            router.replace("/auth/login?error=" + encodeURIComponent("Your account has been suspended"))
            return
          }

          console.log("[Auth Callback] User found in database:", existingUser.email)

          if (existingUser.first_sign_in === true) {
            console.log("[Auth Callback] First sign in detected, redirecting to change password")
            router.replace(`/auth/change-password?userId=${existingUser.id}`)
            return
          }

          console.log("[Auth Callback] Redirecting to home")
          router.replace("/")
        } else {
          console.log("[Auth Callback] No session, redirecting to login")
          router.replace("/auth/login")
        }
      } catch (error) {
        console.error("[Auth Callback] Unexpected error:", error)
        router.replace("/auth/login")
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="text-white">Processing authentication...</div>
    </div>
  )
}
