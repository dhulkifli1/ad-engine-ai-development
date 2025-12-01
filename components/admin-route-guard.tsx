"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUserProfile } from "@/hooks/use-user-profile"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminRouteGuardProps {
  children: React.ReactNode
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { profile, loading } = useUserProfile()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  const isAdmin = profile?.role === "Admin"

  useEffect(() => {
    if (!loading) {
      console.log("[v0] AdminRouteGuard: User profile:", profile)
      console.log("[v0] AdminRouteGuard: Is admin:", isAdmin)

      if (!isAdmin) {
        console.log("[v0] AdminRouteGuard: Redirecting non-admin user to home")
        router.push("/")
      } else {
        console.log("[v0] AdminRouteGuard: Admin access granted")
        setIsChecking(false)
      }
    }
  }, [isAdmin, loading, router])

  if (loading || isChecking) {
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

        <div className="relative z-10 flex items-center justify-center w-full py-8">
          <div className="w-full max-w-md p-8 bg-[#2a2a2a]/30 backdrop-blur-[8px] rounded-xl border border-white/10">
            <div className="text-center mb-8">
              <Skeleton className="h-8 w-48 bg-white/10 mx-auto mb-2" />
              <Skeleton className="h-4 w-64 bg-white/10 mx-auto" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full bg-white/10 rounded-lg" />
              <Skeleton className="h-12 w-full bg-white/10 rounded-lg" />
              <Skeleton className="h-12 w-full bg-white/10 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // Will redirect to home page
  }

  return <>{children}</>
}
