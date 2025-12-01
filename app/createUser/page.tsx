"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminRouteGuard } from "@/components/admin-route-guard"
import { ArrowLeft } from "lucide-react"

function CreateUserPageContent() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "User",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const firstNameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (firstNameInputRef.current) {
      firstNameInputRef.current.focus()
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.role) newErrors.role = "Role is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] CreateUser: Form submitted")

    try {
      if (!validateForm()) {
        console.log("[v0] CreateUser: Form validation failed")
        return
      }
    } catch (validationError) {
      console.error("[v0] CreateUser: Validation error:", validationError)
      setErrors({ general: "Form validation error" })
      return
    }

    setIsLoading(true)
    setErrors({})
    setSuccessMessage(null)

    try {
      console.log("[v0] CreateUser: Starting user creation process...")
      console.log("[v0] CreateUser: Form data:", {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      })

      const requestBody = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      }

      console.log("[v0] CreateUser: Making API call to /api/admin/create-user")

      let response: Response
      try {
        response = await fetch("/api/admin/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
        console.log("[v0] CreateUser: Fetch completed successfully")
      } catch (fetchError) {
        console.error("[v0] CreateUser: Fetch error:", fetchError)
        throw new Error("Network error: Unable to connect to server")
      }

      console.log("[v0] CreateUser: API response status:", response.status)
      console.log("[v0] CreateUser: API response ok:", response.ok)

      let result: any
      try {
        result = await response.json()
        console.log("[v0] CreateUser: API response data:", result)
      } catch (jsonError) {
        console.error("[v0] CreateUser: JSON parse error:", jsonError)
        throw new Error("Invalid response from server")
      }

      if (!response.ok) {
        console.log("[v0] CreateUser: API error:", result.error)
        throw new Error(result.error || `Server error: ${response.status}`)
      }

      console.log("[v0] CreateUser: User creation successful:", result)

      setSuccessMessage(
        `User created successfully! ${formData.firstName} ${formData.lastName} can now log in with their email and password.`,
      )

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "User",
      })

      if (firstNameInputRef.current) {
        setTimeout(() => {
          firstNameInputRef.current?.focus()
        }, 100)
      }
    } catch (error: unknown) {
      console.error("[v0] CreateUser: User creation error:", error)
      setErrors({
        general: error instanceof Error ? error.message : "An unexpected error occurred during user creation",
      })
    } finally {
      setIsLoading(false)
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

      <div className="relative z-10 flex items-center justify-center w-full py-8">
        <div className="w-full max-w-md p-8 bg-[#2a2a2a]/30 backdrop-blur-[8px] rounded-xl border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Create User Account</h1>
            <p className="text-gray-400">Create a new user account with specified role</p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <p className="text-green-400 text-sm font-medium">Success!</p>
              </div>
              <p className="text-green-300 text-sm mt-1">{successMessage}</p>
            </div>
          )}

          {errors.general && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-md">
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white">
                  First name
                </Label>
                <Input
                  ref={firstNameInputRef}
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                  placeholder="John"
                  disabled={isLoading}
                />
                {errors.firstName && <p className="text-red-400 text-sm">{errors.firstName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                  placeholder="Doe"
                  disabled={isLoading}
                />
                {errors.lastName && <p className="text-red-400 text-sm">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                placeholder="john@example.com"
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-white">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange("role", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full bg-black/20 border-white/20 text-white focus:border-white/40">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="w-full bg-[#2a2a2a] border-white/20">
                  <SelectItem value="User" className="text-white hover:bg-white/10">
                    User
                  </SelectItem>
                  <SelectItem value="Admin" className="text-white hover:bg-white/10">
                    Admin
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-red-400 text-sm">{errors.role}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Creating user..." : "Create User"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              className="flex items-center gap-2 mx-auto bg-transparent hover:bg-white/10 text-white hover:text-white [&_svg]:text-white [&_svg]:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreateUserPage() {
  console.log("[v0] CreateUserPage: Component rendering")

  return (
    <AdminRouteGuard>
      <CreateUserPageContent />
    </AdminRouteGuard>
  )
}
