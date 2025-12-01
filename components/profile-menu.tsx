"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { UserAvatar } from "./user-avatar"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, User, Lock, Edit, Info, Trash2, ExternalLink, UserPlus, LogOut, Users, MessageSquare } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface ProfileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileMenu({ isOpen, onClose }: ProfileMenuProps) {
  const { profile, loading, refetch } = useUserProfile()
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [showEmailMessage, setShowEmailMessage] = useState(false)
  const [updateMessage, setUpdateMessage] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const setTemporaryMessage = (message: string) => {
    setUpdateMessage(message)
    if (message.includes("successfully")) {
      setTimeout(() => {
        setUpdateMessage("")
      }, 3000)
    }
  }

  const handleChangePasswordRedirect = () => {
    if (!user) return

    onClose()

    router.push(`/auth/change-password?userId=${user.id}`)
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith("image/")) {
      setUpdateMessage("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUpdateMessage("File size must be less than 5MB")
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)

    setIsUploadingPhoto(true)
    setUpdateMessage("")

    console.log("[v0] Profile photo upload starting:", file.name)

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${user.id}-${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file)

      if (uploadError) {
        console.error("[v0] Upload error:", uploadError)
        setUpdateMessage("Failed to upload photo")
        setPhotoPreview(null)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName)

      console.log("[v0] Photo uploaded, updating profile with URL:", publicUrl)

      const { error: updateError } = await supabase.from("users").update({ photo_url: publicUrl }).eq("id", user.id)

      if (updateError) {
        console.error("[v0] Profile update error:", updateError)
        setUpdateMessage("Failed to update profile picture")
        setPhotoPreview(null)
        return
      }

      console.log("[v0] Profile photo updated successfully")
      await refetch()
      setTemporaryMessage("Profile photo updated successfully!")
      setPhotoPreview(null)
    } catch (error) {
      console.error("[v0] Photo upload error:", error)
      setUpdateMessage("Failed to upload photo")
      setPhotoPreview(null)
    } finally {
      setIsUploadingPhoto(false)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!user) return

    setIsUploadingPhoto(true)
    setUpdateMessage("")

    try {
      console.log("[v0] Removing profile photo")

      const { error: updateError } = await supabase.from("users").update({ photo_url: null }).eq("id", user.id)

      if (updateError) {
        console.error("[v0] Profile update error:", updateError)
        setUpdateMessage("Failed to remove profile picture")
        return
      }

      console.log("[v0] Profile photo removed successfully")
      await refetch()
      setTemporaryMessage("Profile photo removed successfully!")
      setPhotoPreview(null)
    } catch (error) {
      console.error("[v0] Photo removal error:", error)
      setUpdateMessage("Failed to remove photo")
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsUpdating(true)
    setUpdateMessage("")

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const firstName = formData.get("firstName") as string
      const lastName = formData.get("lastName") as string

      const { error } = await supabase
        .from("users")
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        console.error("Profile update error:", error)
        setUpdateMessage("Failed to update profile")
        return
      }

      await refetch()
      setTemporaryMessage("Profile updated successfully!")
    } catch (error) {
      console.error("Profile update error:", error)
      setUpdateMessage("Failed to update profile")
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-96 bg-[#2a2a2a]/95 backdrop-blur-[12px] border-l border-white/10 z-50 transform transition-transform duration-300 ease-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Profile Settings</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Profile Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="relative">
                {photoPreview ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20">
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Photo preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <UserAvatar size="xl" />
                )}

                {/* Upload button - moved to top-right quadrant */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="absolute -top-1 -right-1 p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-full transition-colors"
                >
                  <Edit className="w-4 h-4 text-white" />
                </button>

                {/* Remove button - moved to bottom-right position where upload button was */}
                {(profile?.photo_url || photoPreview) && !isUploadingPhoto && (
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute -bottom-1 -right-1 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">
                  {profile?.first_name} {profile?.last_name}
                </h3>
                <p className="text-white/60 text-sm">{profile?.email}</p>
                {profile?.role && (
                  <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full mt-1">
                    {profile.role}
                  </span>
                )}
                {isUploadingPhoto && <p className="text-blue-400 text-xs mt-1">Uploading photo...</p>}
              </div>
            </div>
          </div>

          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "profile"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "password"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              <Lock className="w-4 h-4" />
              Password
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {updateMessage && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  updateMessage.includes("successfully")
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {updateMessage}
              </div>
            )}

            {activeTab === "profile" && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white/80">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={profile?.first_name || ""}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white/80">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={profile?.last_name || ""}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ""}
                      readOnly
                      className="bg-white/5 border-white/10 text-white/60 cursor-not-allowed"
                      onClick={() => setShowEmailMessage(true)}
                    />
                    {showEmailMessage && (
                      <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs flex items-center gap-2">
                        <Info className="w-3 h-3" />
                        Email cannot be changed for security reasons
                        <button
                          onClick={() => setShowEmailMessage(false)}
                          className="ml-auto text-amber-400 hover:text-amber-300"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={isUpdating} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  {isUpdating ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            )}

            {activeTab === "password" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Lock className="w-4 h-4" />
                    <span className="font-medium">Change Password</span>
                  </div>

                  <Button
                    onClick={handleChangePasswordRedirect}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Go to Change Password
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Controls */}
          <div className="border-t border-white/10 p-6 bg-[#2a2a2a]/50 backdrop-blur-[12px]">
            <div className="space-y-3">
              {profile?.role === "Admin" && (
                <>
                  <Button
                    onClick={() => {
                      onClose()
                      router.push("/createUser")
                    }}
                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 justify-start gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create User
                  </Button>

                  <Button
                    onClick={() => {
                      onClose()
                      router.push("/manageUsers")
                    }}
                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 justify-start gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Manage Users
                  </Button>
                </>
              )}

              <Button
                onClick={() => {
                  onClose()
                  window.open("https://forms.clickup.com/8588093/f/862tx-93471/ZI169FE6TG36U3NGOX", "_blank")
                }}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 justify-start gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Give Feedback
              </Button>

              <Button
                onClick={() => {
                  onClose()
                  // Trigger logout from parent component
                  const logoutEvent = new CustomEvent("profileLogout")
                  window.dispatchEvent(logoutEvent)
                }}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 justify-start gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
