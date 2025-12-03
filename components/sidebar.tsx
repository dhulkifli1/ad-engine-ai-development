"use client"

import type React from "react"
import { Search, Plus, ChevronDown, ChevronRight, MessageSquare, Loader2, X, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useMemo, useRef } from "react"
import type { Chat } from "@/hooks/use-chats"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useBrandFolders, type BrandWithFolders } from "@/hooks/use-brand-folders"
import type { Brand } from "@/types/brand" // Declare the Brand variable
import { generateUUID } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TutorialVideoCard } from "@/components/tutorial-video-card"

interface SidebarProps {
  chats: Chat[]
  activeChat: string
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  selectedBrand: string | null
  onBrandSelect: (brandId: string) => void
  onLogout: () => void
  onDeleteChat: (chatId: string) => void
  onClearSelectedBrand: () => void
  onForceRemount: () => void
  onRenameChat: (chatId: string, newName: string) => void
  expandedBrandAfterRemount?: string | null
  isCreatingBrandChat?: string | null
}

const BxTrash = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.33333 13.3333C3.33333 13.6869 3.47381 14.0261 3.72386 14.2761C3.97391 14.5262 4.31304 14.6666 4.66667 14.6666H11.3333C11.687 14.6666 12.0261 14.5262 12.2761 14.2761C12.5262 14.0261 12.6667 13.6869 12.6667 13.3333V5.33331H14V3.99998H11.3333V2.66665C11.3333 2.31302 11.1929 1.97389 10.9428 1.72384C10.6928 1.47379 10.3536 1.33331 10 1.33331H6C5.64638 1.33331 5.30724 1.47379 5.05719 1.72384C4.80714 1.97379 4.66667 2.31302 4.66667 2.66665V3.99998H2V5.33331H3.33333V13.3333ZM6 2.66665H10V3.99998H6V2.66665ZM5.33333 5.33331H11.3333V13.3333H4.66667V5.33331H5.33333Z"
      fill="#B1B1B1"
    />
    <path d="M6 6.66669H7.33333V12H6V6.66669ZM8.66667 6.66669H10V12H8.66667V6.66669Z" fill="#B1B1B1" />
  </svg>
)

const BxPlus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V14M2 8H14" stroke="#B1B1B1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function Sidebar({
  chats,
  activeChat,
  onChatSelect,
  onNewChat,
  selectedBrand,
  onBrandSelect,
  onLogout,
  onDeleteChat,
  onClearSelectedBrand,
  onForceRemount, // Added onForceRemount prop
  onRenameChat,
  expandedBrandAfterRemount, // Add prop for expanded brand after remount
  isCreatingBrandChat, // Add prop to track brand chat creation
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [expandedAgents, setExpandedAgents] = useState<{ [key: string]: boolean }>({})
  const [expandedBrands, setExpandedBrands] = useState<{ [key: string]: boolean }>({})
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({})
  const [agentNames, setAgentNames] = useState<{ [key: string]: string }>({})
  const [deletingChats, setDeletingChats] = useState<Set<string>>(new Set())
  const [brands, setBrands] = useState<Brand[]>([])
  const [brandsLoading, setBrandsLoading] = useState(true)
  const [createBrandOpen, setCreateBrandOpen] = useState(false)
  const [brandFormData, setBrandFormData] = useState({
    name: "",
    description: "",
    logo: null as File | null,
  })
  const [isCreatingBrand, setIsCreatingBrand] = useState(false)
  const [brandError, setBrandError] = useState<string>("")
  const [deleteBrandOpen, setDeleteBrandOpen] = useState(false)
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)
  const [isDeletingBrand, setIsDeletingBrand] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [chatToRename, setChatToRename] = useState<{ id: string; currentName: string } | null>(null)
  const [newChatName, setNewChatName] = useState("")
  const [isRenamingChat, setIsRenamingChat] = useState(false)
  const [deletingMenuItem, setDeletingMenuItem] = useState<string | null>(null)
  const [openDropdownMenu, setOpenDropdownMenu] = useState<string | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [isCardMinimized, setIsCardMinimized] = useState(false)

  const supabase = createClient()
  const { user } = useAuth()
  const router = useRouter()
  const { profile } = useUserProfile()
  const isAdmin = profile?.role === "Admin"
  const [isMac, setIsMac] = useState(true)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const {
    brandsWithFolders,
    loading: foldersLoading,
    setBrandsWithFolders,
    deleteChatFromBrand,
    refetch,
  } = useBrandFolders()

  useEffect(() => {
    // Initial load from localStorage
    const savedState = localStorage.getItem("tutorialCardMinimized")
    if (savedState !== null) {
      setIsCardMinimized(savedState === "true")
    }

    // Listen for storage changes (from the tutorial card component)
    const handleStorageChange = () => {
      const newState = localStorage.getItem("tutorialCardMinimized")
      if (newState !== null) {
        setIsCardMinimized(newState === "true")
      }
    }

    // Poll localStorage every 100ms to detect changes
    const interval = setInterval(handleStorageChange, 100)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchAgentNames = async () => {
      try {
        const { data: agents, error } = await supabase.from("agents").select("id, name")

        if (error) {
          console.error("[v0] Error fetching agents:", error)
          return
        }

        const agentMap: { [key: string]: string } = {}
        agents?.forEach((agent) => {
          agentMap[agent.id] = agent.name
        })

        setAgentNames(agentMap)
      } catch (error) {
        console.error("[v0] Error in fetchAgentNames:", error)
      }
    }

    fetchAgentNames()
  }, [supabase])

  // Keep brands state in sync with brandsWithFolders
  useEffect(() => {
    const brandsData = brandsWithFolders.map((brand) => ({
      id: brand.id,
      name: brand.name,
      image_url: brand.image_url,
      description: brand.description,
      user_id: brand.user_id,
      created_at: brand.created_at,
      updated_at: brand.updated_at,
    }))
    setBrands(brandsData)
    setBrandsLoading(foldersLoading)
  }, [brandsWithFolders, foldersLoading])

  useEffect(() => {
    if (expandedBrandAfterRemount) {
      console.log("[v0] Expanding brand after remount:", expandedBrandAfterRemount)
      setExpandedBrands((prev) => ({
        ...prev,
        [expandedBrandAfterRemount]: true,
      }))

      // Also expand all folders within that brand
      const brand = brandsWithFolders.find((b) => b.id === expandedBrandAfterRemount)
      if (brand) {
        const newExpandedFolders: { [key: string]: boolean } = {}
        brand.folders.forEach((folder) => {
          const folderKey = `${brand.id}-${folder.id}`
          newExpandedFolders[folderKey] = true
        })
        setExpandedFolders((prev) => ({
          ...prev,
          ...newExpandedFolders,
        }))
      }
    }
  }, [expandedBrandAfterRemount, brandsWithFolders])

  useEffect(() => {
    console.log("[v0] Sidebar: chats prop updated, count:", chats.length)
    console.log("[v0] Sidebar: chats with messages:", chats.filter((c) => c.messages.length > 0).length)
    console.log(
      "[v0] Sidebar: non-brand chats with messages:",
      chats.filter((c) => c.messages.length > 0 && !c.brand_id).length,
    )
  }, [chats])

  useEffect(() => {
    // Detect OS on client side
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isMacOS = /mac|iphone|ipad|ipod/.test(userAgent)
    setIsMac(isMacOS)
  }, [])

  useEffect(() => {
    if (renameDialogOpen && renameInputRef.current) {
      // Small delay to ensure dialog is fully rendered
      setTimeout(() => {
        const input = renameInputRef.current
        if (input) {
          input.focus()
          const length = input.value.length
          input.setSelectionRange(length, length)
        }
      }, 100)
    }
  }, [renameDialogOpen])

  const agentGroups = useMemo(() => {
    const realChats = chats.filter((chat) => chat.messages.length > 0 && !chat.brand_id)
    const groups: Record<string, Chat[]> = {}

    console.log("[v0] Sidebar: getAgentGroups called, realChats count:", realChats.length)
    console.log(
      "[v0] Sidebar: realChats:",
      realChats.map((c) => ({ id: c.id, title: c.title, agent_id: c.agent_id, messages: c.messages.length })),
    )

    realChats.forEach((chat) => {
      const agentId = chat.agent_id

      // Skip chats without agent_id if agent names haven't loaded yet
      if (!agentId && Object.keys(agentNames).length === 0) return

      const agentName = agentId ? agentNames[agentId] || agentId : "Default Agent"

      // Skip grouping if agent names haven't loaded yet and we don't have a name
      if (!agentName || agentName === agentId) {
        // Only skip if we're still loading agents
        if (Object.keys(agentNames).length === 0) return
      }

      if (!groups[agentName]) {
        groups[agentName] = []
      }
      groups[agentName].push(chat)
    })

    console.log(
      "[v0] Sidebar: agent groups:",
      Object.keys(groups).map((key) => ({ agent: key, count: groups[key].length })),
    )

    return groups
  }, [chats, agentNames])

  const filteredChats = (agentChats: Chat[]) =>
    agentChats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleChatClick = (chatId: string, title: string) => {
    console.log(`[v0] Opening chat: ${title} with ID: ${chatId}`)
    onChatSelect(chatId)
  }

  const toggleAgentExpansion = (agent: string) => {
    setExpandedAgents((prev) => ({
      ...prev,
      [agent]: !prev[agent],
    }))
  }

  const toggleBrandExpansion = (brandId: string) => {
    setExpandedBrands((prev) => ({
      ...prev,
      [brandId]: !prev[brandId],
    }))
  }

  const toggleFolderExpansion = (brandId: string, folderId: string) => {
    const key = `${brandId}-${folderId}`
    setExpandedFolders((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleBrandClick = (brandId: string) => {
    toggleBrandExpansion(brandId)
  }

  const handleBrandPlusClick = (e: React.MouseEvent, brandId: string) => {
    e.stopPropagation()
    console.log(`[v0] Navigating to new chat for brand: ${brandId}`)

    const brand = brandsWithFolders.find((b) => b.id === brandId)
    if (!brand) {
      console.log(`[v0] Brand not found: ${brandId}`)
      return
    }

    onBrandSelect(brandId)
  }

  const handleBrandFolderClick = (brandId: string) => {
    // Expand the brand
    toggleBrandExpansion(brandId)

    // Navigate to new chat for this brand
    const brand = brandsWithFolders.find((b) => b.id === brandId)
    if (brand) {
      onBrandSelect(brandId)
    }
  }

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()

    setDeletingMenuItem(chatId)
    setDeletingChats((prev) => new Set(prev).add(chatId))

    try {
      const isBrandChat = brandsWithFolders.some((brand) =>
        brand.folders.some((folder) => folder.chats.some((chat) => chat.id === chatId)),
      )

      if (isBrandChat) {
        deleteChatFromBrand(chatId)
      }

      await onDeleteChat(chatId)

      const successEvent = new CustomEvent("showToast", {
        detail: { message: "Chat deleted successfully!", type: "success" },
      })
      window.dispatchEvent(successEvent)
    } catch (error) {
      console.error("[v0] Error deleting chat:", error)
      const errorEvent = new CustomEvent("showToast", {
        detail: { message: "Failed to delete chat", type: "error" },
      })
      window.dispatchEvent(errorEvent)
    } finally {
      setDeletingChats((prev) => {
        const newSet = new Set(prev)
        newSet.delete(chatId)
        return newSet
      })
      setDeletingMenuItem(null)
      setOpenDropdownMenu(null)
    }
  }

  const handleRenameChat = (e: React.MouseEvent, chatId: string, currentName: string) => {
    e.stopPropagation()
    setChatToRename({ id: chatId, currentName })
    setNewChatName(currentName)
    setRenameDialogOpen(true)
  }

  const handleSubmitRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatToRename || !newChatName.trim()) return

    setIsRenamingChat(true)
    const renameChatUrl =
      process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
        ? "https://paidadvertising.app.n8n.cloud/webhook/40f70e05-b26e-4129-803a-d9969e8acabe"
        : "https://paidadvertising.app.n8n.cloud/webhook/beb573eb-99e9-45db-a5c4-9fa95a543a6c";

    try {
      const response = await fetch(
        renameChatUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatToRename.id,
            new_name: newChatName.trim(),
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to rename chat: ${response.status}`)
      }

      // Check if it's a brand chat
      const isBrandChat = brandsWithFolders.some((brand) =>
        brand.folders.some((folder) => folder.chats.some((chat) => chat.id === chatToRename.id)),
      )

      if (isBrandChat) {
        // Update brand chat name in local state
        setBrandsWithFolders((prev) =>
          prev.map((brand) => ({
            ...brand,
            folders: brand.folders.map((folder) => ({
              ...folder,
              chats: folder.chats.map((chat) =>
                chat.id === chatToRename.id ? { ...chat, title: newChatName.trim() } : chat,
              ),
            })),
          })),
        )
      } else {
        // Update regular chat name via callback
        onRenameChat(chatToRename.id, newChatName.trim())
      }

      // Show success toast
      const successEvent = new CustomEvent("showToast", {
        detail: { message: "Chat renamed successfully!", type: "success" },
      })
      window.dispatchEvent(successEvent)

      // Close dialog and reset state
      setRenameDialogOpen(false)
      setChatToRename(null)
      setNewChatName("")
    } catch (error) {
      console.error("[v0] Error renaming chat:", error)
      const errorEvent = new CustomEvent("showToast", {
        detail: { message: "Failed to rename chat", type: "error" },
      })
      window.dispatchEvent(errorEvent)
    } finally {
      setIsRenamingChat(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file")
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB")
        return
      }

      setBrandFormData((prev) => ({ ...prev, logo: file }))

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setLogoPreview(previewUrl)
    }
  }

  const uploadLogoToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `brand-logos/${fileName}`

    const { data, error } = await supabase.storage.from("attachments").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      throw new Error(`Logo upload failed: ${error.message}`)
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("attachments").getPublicUrl(filePath)

    return publicUrl
  }

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !brandFormData.name.trim()) return

    const trimmedName = brandFormData.name.trim()
    const duplicateBrand = brandsWithFolders.find((brand) => brand.name.toLowerCase() === trimmedName.toLowerCase())

    if (duplicateBrand) {
      setBrandError(`Brand "${trimmedName}" already exists. Please delete it first before trying to recreate it.`)
      return
    }

    setIsCreatingBrand(true)
    setBrandError("")

    try {
      let logoUrl = null

      if (brandFormData.logo) {
        logoUrl = await uploadLogoToSupabase(brandFormData.logo)
      }

      const brandId = generateUUID()
      const currentTime = new Date().toISOString()

      const brandPayload = {
        id: brandId,
        user_id: user.id,
        name: brandFormData.name.trim(),
        image_url: logoUrl,
        description: brandFormData.description.trim(),
        created_at: currentTime,
        updated_at: currentTime,
      }

      // First, create the brand in database via API
      const response = await fetch("/api/brand/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(brandPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Brand creation failed:", errorData)
        setBrandError(`Failed to create brand: ${errorData.error}`)
        return
      }

      console.log("[v0] Brand created successfully in database")

      console.log("[v0] Waiting for webhook to complete and forcing component remount...")

      // Wait for webhook processing (2 seconds should be enough for n8n webhook)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      onForceRemount()

      console.log("[v0] Component remount triggered after brand creation")

      // Clear form and close dialog
      setBrandFormData({ name: "", description: "", logo: null })
      setLogoPreview(null)
      setBrandError("")
      setCreateBrandOpen(false)

      // Show success message
      const successEvent = new CustomEvent("showToast", {
        detail: { message: "Brand created successfully!", type: "success" },
      })
      window.dispatchEvent(successEvent)
    } catch (error) {
      console.error("[v0] Error creating brand:", error)
      setBrandError(`Error creating brand: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsCreatingBrand(false)
    }
  }

  const handleDeleteBrand = async (e: React.MouseEvent, brandId: string) => {
    e.stopPropagation()

    const brand = brandsWithFolders.find((b) => b.id === brandId)
    if (brand) {
      setBrandToDelete(brand)
      setDeleteBrandOpen(true)
    }
  }

  const confirmDeleteBrand = async () => {
    if (!brandToDelete) return

    setIsDeletingBrand(true)

    try {
      const allBrandChats = brandToDelete.folders.flatMap((folder) => folder.chats)
      const chatIds = allBrandChats.map((chat) => chat.id)
      const deleteBrandUrl =
        process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
          ? "https://paidadvertising.app.n8n.cloud/webhook/371a96cc-a4a2-4402-baca-18803e9ddb24"
          : "https://paidadvertising.app.n8n.cloud/webhook/d78287be-6c4a-40f7-bff8-4c8bf9935823";

      const response = await fetch(
        deleteBrandUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            brand_id: brandToDelete.id,
            chat_ids: chatIds,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to delete brand: ${response.status}`)
      }

      setBrandsWithFolders((prev) => prev.filter((brand) => brand.id !== brandToDelete.id))

      if (selectedBrand === brandToDelete.id) {
        onClearSelectedBrand()
      }

      if (allBrandChats.some((chat) => chat.id === activeChat)) {
        router.push("/")
        onNewChat()
      }

      const successEvent = new CustomEvent("showToast", {
        detail: { message: "Brand successfully deleted", type: "success" },
      })
      window.dispatchEvent(successEvent)

      console.log("[v0] Brand deleted successfully:", brandToDelete.id)
    } catch (error) {
      console.error("[v0] Error deleting brand:", error)
      alert(`Error deleting brand: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsDeletingBrand(false)
      setDeleteBrandOpen(false)
      setBrandToDelete(null)
    }
  }

  const getBrandAvatar = (brand: BrandWithFolders) => {
    if (brand.image_url) {
      return (
        <img
          src={brand.image_url || "/placeholder.svg"}
          alt={brand.name}
          className="w-4 h-4 object-contain rounded-full"
        />
      )
    }

    return (
      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
        <span className="text-xs text-white font-medium">{brand.name.charAt(0).toUpperCase()}</span>
      </div>
    )
  }

  // Handler to clear selected brand before creating new chat
  const handleNewChatClick = () => {
    // Clear selected brand first to ensure we create a general chat
    onClearSelectedBrand()
    // Then create the new chat
    onNewChat()
  }

  return (
    <div className={`w-80 flex flex-col items-stretch relative h-full`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4 transition-all duration-150">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <img
                src="/images/design-mode/Lab%20logo%281%29%281%29.png"
                alt="Lab Logo"
                className="w-6 h-6"
              />
            </div>
            <span className="text-sm font-medium text-white">
              PaidAdvertising.com
            </span>
          </div>
        </div>

        <Button
          onClick={handleNewChatClick}
          className={`w-full bg-[#171717]/70 hover:bg-[#171717]/90 text-white border-0 justify-start gap-2 transition-all duration-150 hover:scale-[1.02]`}
        >
          <Plus className="w-4 h-4" />
          New Chat
          <div className="ml-auto flex items-center gap-1">
            {isMac ? (
              <>
                <span className="text-xs text-gray-400">⌘</span>
                <span className="text-xs text-gray-400">K</span>
              </>
            ) : (
              <span className="text-xs text-gray-400">Ctrl K</span>
            )}
          </div>
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#B1B1B1] transition-all duration-150`}
          />
          <Input
            ref={searchInputRef}
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 pr-10 bg-transparent border-transparent placeholder-[#B1B1B1] text-[#B1B1B1] focus:border-transparent focus:bg-[#1a1a1a] transition-all duration-150 hover:scale-[1.02]`}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B1B1B1] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation - 16px spacing between sections */}
      <div
        className={`flex-1 space-y-4 overflow-y-auto scrollbar-custom pb-4 ${
          isCardMinimized
            ? "max-h-[calc(100vh-280px)]"
            : "max-h-[calc(100vh-420px)]"
        }`}
      >
        {/* My Brands */}
        <div className="transition-all duration-150">
          <div className="flex items-center justify-between px-4">
            <span className="text-white text-sm font-medium">My Brands</span>
            <Dialog
              open={createBrandOpen}
              onOpenChange={(open) => {
                setCreateBrandOpen(open);
                if (!open) {
                  setBrandError("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-white hover:text-white hover:bg-[#2a2a2a] p-1 transition-all duration-150 hover:scale-110`}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#2a2a2a]/95 border border-white/10 text-white">
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[20px] -z-10" />
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Create New Brand
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateBrand} className="space-y-4">
                  {brandError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-400 text-sm">{brandError}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="brandLogo" className="text-white">
                      Brand Logo (Optional)
                    </Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center bg-black/20">
                        {logoPreview ? (
                          <img
                            src={logoPreview || "/placeholder.svg"}
                            alt="Logo preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-center">
                            <svg
                              className="w-6 h-6 text-gray-400 mx-auto mb-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          id="brandLogo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          disabled={isCreatingBrand}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            document.getElementById("brandLogo")?.click()
                          }
                          disabled={isCreatingBrand}
                          className="w-full text-white hover:bg-white/10 border border-white/20"
                        >
                          {brandFormData.logo ? "Change Logo" : "Upload Logo"}
                        </Button>
                        {brandFormData.logo && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setBrandFormData((prev) => ({
                                ...prev,
                                logo: null,
                              }));
                              setLogoPreview(null);
                            }}
                            disabled={isCreatingBrand}
                            className="w-full text-red-400 hover:bg-red-400/10 mt-2"
                          >
                            Remove Logo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brandName" className="text-white">
                      Brand Name
                    </Label>
                    <Input
                      id="brandName"
                      value={brandFormData.name}
                      onChange={(e) => {
                        setBrandFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }));
                        if (brandError) {
                          setBrandError("");
                        }
                      }}
                      className="bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                      placeholder="Enter brand name"
                      required
                      disabled={isCreatingBrand}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brandDescription" className="text-white">
                      Description
                    </Label>
                    <Textarea
                      id="brandDescription"
                      value={brandFormData.description}
                      onChange={(e) =>
                        setBrandFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40 min-h-[80px]"
                      placeholder="Enter brand description"
                      disabled={isCreatingBrand}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setCreateBrandOpen(false);
                        setBrandFormData({
                          name: "",
                          description: "",
                          logo: null,
                        });
                        setLogoPreview(null);
                        setBrandError("");
                      }}
                      disabled={isCreatingBrand}
                      className="flex-1 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreatingBrand || !brandFormData.name.trim()}
                      className="flex-1 bg-white text-black hover:bg-gray-200"
                    >
                      {isCreatingBrand ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        "Create Brand"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="mt-2 space-y-2 px-4">
            {foldersLoading ? (
              <div className="text-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-[#B1B1B1] mx-auto" />
              </div>
            ) : brandsWithFolders.length === 0 ? (
              <div className="text-center py-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke="#60A5FA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="#60A5FA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="#60A5FA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-[#B1B1B1] text-sm mb-1">No brands yet</p>
                <p className="text-[#777777] text-xs">
                  Click + to create your first brand
                </p>
              </div>
            ) : (
              brandsWithFolders.map((brand) => {
                const isBrandExpanded = expandedBrands[brand.id] === true;
                return (
                  <div key={brand.id} className="space-y-1">
                    {/* Brand Header */}
                    <div
                      className={`flex items-center justify-between group text-sm py-1 cursor-pointer rounded-lg px-2 transition-all duration-150 hover:scale-[1.02] ${
                        selectedBrand === brand.id
                          ? "border border-[#777777]/40 bg-[#2a2a2a] text-white"
                          : "text-white hover:text-white hover:bg-[#2a2a2a]"
                      }`}
                    >
                      <div
                        onClick={() => handleBrandFolderClick(brand.id)}
                        className="flex items-center gap-2 flex-1"
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          {getBrandAvatar(brand)}
                        </div>
                        <span>{brand.name}</span>
                        {isCreatingBrandChat === brand.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[#B1B1B1]" />
                        ) : isBrandExpanded ? (
                          <ChevronDown className="w-3 h-3 text-[#B1B1B1]" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-[#B1B1B1]" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleBrandPlusClick(e, brand.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#B1B1B1] hover:text-white hover:bg-[#2a2a2a] p-1 h-6 w-6 transition-all duration-150"
                        >
                          <BxPlus />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteBrand(e, brand.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#B1B1B1] hover:text-red-400 hover:bg-[rgb(239,68,68,0.1)] p-1 h-6 w-6 transition-all duration-150"
                        >
                          <BxTrash />
                        </Button>
                      </div>
                    </div>

                    {/* Brand Folders */}
                    {isBrandExpanded && (
                      <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {brand.folders.map((folder) => {
                          const folderKey = `${brand.id}-${folder.id}`;
                          const isFolderExpanded =
                            expandedFolders[folderKey] !== false; // Default to expanded
                          return (
                            <div key={folder.id} className="space-y-1">
                              {/* Folder Header */}
                              <div className="flex items-center justify-between group text-sm py-1 cursor-pointer rounded px-2 transition-all duration-150 hover:bg-[#2a2a2a]/50">
                                <div
                                  onClick={() =>
                                    toggleFolderExpansion(brand.id, folder.id)
                                  }
                                  className="flex items-center gap-2 flex-1"
                                >
                                  <span className="text-[#B1B1B1]">
                                    {folder.name}
                                  </span>
                                  {isFolderExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-[#B1B1B1]" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-[#B1B1B1]" />
                                  )}
                                </div>
                              </div>

                              {/* Folder Chats */}
                              {isFolderExpanded && (
                                <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                  {folder.chats.length === 0 ? (
                                    <div className="text-xs text-[#777777] py-1 px-2">
                                      No chats yet
                                    </div>
                                  ) : (
                                    folder.chats.map((chat) => (
                                      <div
                                        key={chat.id}
                                        className={`flex items-center justify-between group text-sm py-1 rounded px-2 cursor-pointer transition-all duration-150 hover:bg-[#2a2a2a] ${
                                          activeChat === chat.id
                                            ? "bg-[#2a2a2a] text-white"
                                            : "text-[#FAFAFA] hover:text-white"
                                        }`}
                                      >
                                        <div
                                          onClick={() =>
                                            handleChatClick(chat.id, chat.title)
                                          }
                                          className="flex-1 truncate"
                                        >
                                          {chat.title}
                                        </div>
                                        {/* Brand chat dropdown - around line 600 */}
                                        <DropdownMenu
                                          modal={false}
                                          open={openDropdownMenu === chat.id}
                                          onOpenChange={(open) => {
                                            if (
                                              !open &&
                                              deletingMenuItem === chat.id
                                            ) {
                                              return;
                                            }
                                            setOpenDropdownMenu(
                                              open ? chat.id : null
                                            );
                                          }}
                                        >
                                          <DropdownMenuTrigger asChild>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setOpenDropdownMenu(chat.id);
                                              }}
                                              aria-label="Chat options"
                                              title="Chat options"
                                              className="opacity-0 group-hover:opacity-100 text-[#B1B1B1] hover:text-white hover:bg-[#3a3a3a] p-1 h-6 w-6 transition-all duration-150 rounded inline-flex items-center justify-center"
                                            >
                                              <MoreVertical className="w-4 h-4 pointer-events-none" />
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent
                                            align="start"
                                            sideOffset={5}
                                            className="bg-[#2a2a2a] border border-white/10 text-white min-w-[160px] z-[100]"
                                          >
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRenameChat(
                                                  e,
                                                  chat.id,
                                                  chat.title
                                                );
                                                setOpenDropdownMenu(null);
                                              }}
                                              className="text-white hover:bg-white/5 focus:bg-white/5 focus:text-white cursor-pointer"
                                            >
                                              Rename chat
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteChat(e, chat.id);
                                              }}
                                              disabled={deletingChats.has(
                                                chat.id
                                              )}
                                              className="text-red-400 hover:bg-red-400/10 focus:bg-red-400/10 focus:text-red-400 cursor-pointer"
                                            >
                                              {deletingMenuItem === chat.id ? (
                                                <div className="flex items-center gap-2">
                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                  <span>Deleting...</span>
                                                </div>
                                              ) : (
                                                "Delete chat"
                                              )}
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={`border-t border-[#3e3e3e]/30 mx-4`}></div>

        {/* Chat History */}
        {Object.keys(agentGroups).length === 0 ? (
          <div className="px-4 py-8 text-center transition-all duration-200">
            <MessageSquare className={`w-8 h-8 text-[#B1B1B1] mx-auto mb-3`} />
            <p className={`text-[#B1B1B1] text-sm mb-2`}>No chats yet</p>
            <p className={`text-[#777777] text-xs`}>
              Start a conversation to see your chats organized by agent here
            </p>
          </div>
        ) : (
          <>
            {Object.entries(agentGroups).map(([agentName, agentChats]) => {
              const isExpanded = expandedAgents[agentName] !== false;
              return (
                <div key={agentName} className="transition-all duration-150">
                  <Button
                    variant="ghost"
                    onClick={() => toggleAgentExpansion(agentName)}
                    className={`w-full justify-start text-[#B1B1B1] p-0 h-auto gap-2 px-4 hover:bg-transparent hover:text-[#B1B1B1] transition-all duration-150`}
                  >
                    <span>{agentName} Chats</span>
                    {isExpanded ? (
                      <ChevronDown className={`w-4 h-4 text-[#B1B1B1]`} />
                    ) : (
                      <ChevronRight className={`w-4 h-4 text-[#B1B1B1]`} />
                    )}
                  </Button>
                  {isExpanded && (
                    <div className="mt-2 space-y-1 px-4 animate-in slide-in-from-top-2 duration-200">
                      {filteredChats(agentChats).map((chat) => (
                        <div
                          key={chat.id}
                          className={`flex items-center justify-between group text-sm py-1 rounded px-2 cursor-pointer transition-all duration-150 hover:bg-[#2a2a2a] ${
                            activeChat === chat.id
                              ? "bg-[#2a2a2a] text-white"
                              : "text-[#FAFAFA] hover:text-white"
                          }`}
                        >
                          <div
                            onClick={() => handleChatClick(chat.id, chat.title)}
                            className="flex-1"
                          >
                            {chat.title}
                          </div>
                          {/* Regular chat dropdown - around line 850 */}
                          <DropdownMenu
                            modal={false}
                            open={openDropdownMenu === chat.id}
                            onOpenChange={(open) => {
                              if (!open && deletingMenuItem === chat.id) {
                                return;
                              }
                              setOpenDropdownMenu(open ? chat.id : null);
                            }}
                          >
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setOpenDropdownMenu(chat.id);
                                }}
                                aria-label="Chat options"
                                title="Chat options"
                                className="opacity-0 group-hover:opacity-100 text-[#B1B1B1] hover:text-white hover:bg-[#3a3a3a] p-1 h-6 w-6 transition-all duration-150 rounded inline-flex items-center justify-center"
                              >
                                <MoreVertical className="w-4 h-4 pointer-events-none" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              sideOffset={5}
                              className="bg-[#2a2a2a] border border-white/10 text-white min-w-[160px] z-[100]"
                            >
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameChat(e, chat.id, chat.title);
                                  setOpenDropdownMenu(null);
                                }}
                                className="text-white hover:bg-white/5 focus:bg-white/5 focus:text-white cursor-pointer"
                              >
                                Rename chat
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteChat(e, chat.id);
                                }}
                                disabled={deletingChats.has(chat.id)}
                                className="text-red-400 hover:bg-red-400/10 focus:bg-red-400/10 focus:text-red-400 cursor-pointer"
                              >
                                {deletingMenuItem === chat.id ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Deleting...</span>
                                  </div>
                                ) : (
                                  "Delete chat"
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pointer-events-none">
        <div className="pointer-events-auto">
          <TutorialVideoCard />
        </div>
      </div>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="bg-[#2a2a2a]/95 border border-white/10 text-white">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[20px] -z-10" />
          <DialogHeader>
            <DialogTitle className="text-white">Rename Chat</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitRename} className="space-y-4">
            <div className="space-y-2">
              <Input
                ref={renameInputRef}
                id="chatName"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                className="bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 selection:bg-blue-500/50 selection:text-white"
                placeholder="Enter new chat name"
                required
                disabled={isRenamingChat}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRenameDialogOpen(false);
                  setChatToRename(null);
                  setNewChatName("");
                }}
                disabled={isRenamingChat}
                className="flex-1 text-white hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isRenamingChat ||
                  !newChatName.trim() ||
                  (chatToRename &&
                    newChatName.trim() === chatToRename.currentName)
                }
                className="flex-1 bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:opacity-50"
              >
                {isRenamingChat ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Renaming...
                  </>
                ) : (
                  "Rename"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Brand Confirmation Dialog */}
      <Dialog open={deleteBrandOpen} onOpenChange={setDeleteBrandOpen}>
        <DialogContent className="bg-[#2a2a2a]/95 border border-white/10 text-white">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[20px] -z-10" />
          <DialogHeader>
            <DialogTitle className="text-white">Delete Brand</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-white">
              Are you sure you want to delete brand{" "}
              <strong>{brandToDelete?.name}</strong>?
            </p>
            <p className="text-[#B1B1B1] text-sm">
              This action cannot be undone. All associated data will be
              permanently removed.
            </p>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteBrandOpen(false)}
                disabled={isDeletingBrand}
                className="flex-1 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteBrand}
                disabled={isDeletingBrand}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                {isDeletingBrand ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete Brand"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Controls */}
    </div>
  );
}
