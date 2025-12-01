"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import type { Chat } from "@/hooks/use-chats"
import { generateUUID } from "@/lib/utils"

export interface BrandFolder {
  id: string // agent_id
  name: string // agent name
  agent_id: string
  chats: Chat[]
}

export interface BrandWithFolders {
  id: string
  name: string
  image_url: string | null
  description: string
  user_id: string
  created_at: string
  updated_at: string
  folders: BrandFolder[]
}

export function useBrandFolders() {
  const { user } = useAuth()
  const [brandsWithFolders, setBrandsWithFolders] = useState<BrandWithFolders[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBrandsWithFolders = async () => {
    if (!user) {
      setBrandsWithFolders([])
      setLoading(false)
      return
    }

    const client = createClient()

    try {
      console.log("[v0] Fetching brands with folders for user:", user.id)

      // Fetch brands
      const { data: brandsData, error: brandsError } = await client
        .from("brands")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (brandsError) {
        console.error("[v0] Error fetching brands:", brandsError)
        return
      }

      // Fetch all agents for folder names
      const { data: agentsData, error: agentsError } = await client
        .from("agents")
        .select("*")
        .order("name", { ascending: true })

      if (agentsError) {
        console.error("[v0] Error fetching agents:", agentsError)
        return
      }

      const brandsWithFoldersData = await Promise.all(
        (brandsData || []).map(async (brand) => {
          // Fetch all chats for this brand
          const { data: chatsData, error: chatsError } = await client
            .from("chats")
            .select(`
              *,
              messages (*)
            `)
            .eq("brand_id", brand.id)
            .order("updated_at", { ascending: false })

          if (chatsError) {
            console.error("[v0] Error fetching chats for brand:", brand.id, chatsError)
            return { ...brand, folders: [] }
          }

          // Group chats by agent_id to create folders
          const chatsByAgent = new Map<string, Chat[]>()

          for (const chat of chatsData || []) {
            const agentId = chat.agent_id || "default"
            if (!chatsByAgent.has(agentId)) {
              chatsByAgent.set(agentId, [])
            }
            chatsByAgent.get(agentId)!.push(chat)
          }

          // Create folders from grouped chats
          const folders: BrandFolder[] = []

          for (const [agentId, chats] of chatsByAgent.entries()) {
            const agent = agentsData?.find((a) => a.id === agentId)
            const folderName = agent ? `${agent.name} Chats` : "Default Agent Chats"

            folders.push({
              id: agentId,
              name: folderName,
              agent_id: agentId,
              chats: chats,
            })
          }

          // Sort folders by name
          folders.sort((a, b) => a.name.localeCompare(b.name))

          return { ...brand, folders }
        }),
      )

      setBrandsWithFolders(brandsWithFoldersData)
    } catch (error) {
      console.error("[v0] Error in fetchBrandsWithFolders:", error)
      setBrandsWithFolders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBrandsWithFolders()

    if (!user) return

    const supabase = createClient() // Create supabase client instance here

    console.log("[v0] Setting up brand folders subscriptions for user:", user.id)

    // Set up real-time subscriptions similar to regular chats
    const brandsSubscription = supabase
      .channel(`brand_folders_brands_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brands", filter: `user_id=eq.${user.id}` },
        async (payload) => {
          console.log("[v0] Brand change detected in useBrandFolders:", payload)

          if (payload.eventType === "INSERT") {
            // Add new brand with empty folders
            const newBrand = payload.new as any
            console.log("[v0] Adding new brand to brandsWithFolders:", newBrand)
            setBrandsWithFolders((prev) => {
              // Check if brand already exists to avoid duplicates
              const exists = prev.some((brand) => brand.id === newBrand.id)
              if (exists) {
                console.log("[v0] Brand already exists, skipping duplicate")
                return prev
              }
              console.log("[v0] Brand added to brandsWithFolders via subscription")
              return [{ ...newBrand, folders: [] }, ...prev]
            })
          } else if (payload.eventType === "DELETE") {
            // Remove deleted brand
            setBrandsWithFolders((prev) => prev.filter((brand) => brand.id !== payload.old.id))
          } else if (payload.eventType === "UPDATE") {
            // Update brand info
            const updatedBrand = payload.new as any
            setBrandsWithFolders((prev) =>
              prev.map((brand) => (brand.id === updatedBrand.id ? { ...brand, ...updatedBrand } : brand)),
            )
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Brands subscription status:", status)
      })

    // Subscribe to chat changes for brand chats
    const chatsSubscription = supabase
      .channel(`brand_folders_chats_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, async (payload) => {
        console.log("[v0] Brand chat change detected:", payload)

        const chatData = payload.new || payload.old
        if (chatData && chatData.brand_id) {
          // Verify this chat belongs to one of the user's brands
          const { data: brandCheck } = await supabase
            .from("brands")
            .select("id")
            .eq("id", chatData.brand_id)
            .eq("user_id", user.id)
            .single()

          if (!brandCheck) {
            console.log("[v0] Chat doesn't belong to user's brand, ignoring")
            return
          }

          if (payload.eventType === "INSERT") {
            // Add new chat to appropriate brand folder
            const newChat = payload.new as any

            // Fetch agent info for proper folder naming
            const { data: agent } = await supabase.from("agents").select("name").eq("id", newChat.agent_id).single()

            const folderName = agent ? `${agent.name} Chats` : "Default Agent Chats"

            setBrandsWithFolders((prev) =>
              prev.map((brand) => {
                if (brand.id === newChat.brand_id) {
                  // Find or create the appropriate folder
                  const existingFolderIndex = brand.folders.findIndex((folder) => folder.agent_id === newChat.agent_id)

                  if (existingFolderIndex >= 0) {
                    // Add to existing folder
                    const updatedFolders = [...brand.folders]
                    updatedFolders[existingFolderIndex] = {
                      ...updatedFolders[existingFolderIndex],
                      chats: [{ ...newChat, messages: [] }, ...updatedFolders[existingFolderIndex].chats],
                    }
                    return { ...brand, folders: updatedFolders }
                  } else {
                    // Create new folder
                    const newFolder: BrandFolder = {
                      id: newChat.agent_id,
                      name: folderName,
                      agent_id: newChat.agent_id,
                      chats: [{ ...newChat, messages: [] }],
                    }
                    return { ...brand, folders: [...brand.folders, newFolder] }
                  }
                }
                return brand
              }),
            )
          } else if (payload.eventType === "DELETE") {
            // Remove deleted chat
            const deletedChat = payload.old as any
            setBrandsWithFolders((prev) =>
              prev.map((brand) => ({
                ...brand,
                folders: brand.folders
                  .map((folder) => ({
                    ...folder,
                    chats: folder.chats.filter((chat) => chat.id !== deletedChat.id),
                  }))
                  .filter((folder) => folder.chats.length > 0), // Remove empty folders
              })),
            )
          } else if (payload.eventType === "UPDATE") {
            // Update existing chat
            const updatedChat = payload.new as any
            setBrandsWithFolders((prev) =>
              prev.map((brand) => ({
                ...brand,
                folders: brand.folders.map((folder) => ({
                  ...folder,
                  chats: folder.chats.map((chat) => (chat.id === updatedChat.id ? { ...chat, ...updatedChat } : chat)),
                })),
              })),
            )
          }
        }
      })
      .subscribe((status) => {
        console.log("[v0] Brand chats subscription status:", status)
      })

    // Subscribe to message changes for brand chats
    const messagesSubscription = supabase
      .channel(`brand_folders_messages_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, async (payload) => {
        console.log("[v0] Brand message change detected:", payload)

        const messageData = payload.new || payload.old
        if (messageData && messageData.chat_id) {
          // Check if this message belongs to a brand chat
          const { data: chatCheck } = await supabase
            .from("chats")
            .select("brand_id")
            .eq("id", messageData.chat_id)
            .single()

          if (!chatCheck?.brand_id) {
            return // Not a brand chat
          }

          // Verify the brand belongs to this user
          const { data: brandCheck } = await supabase
            .from("brands")
            .select("id")
            .eq("id", chatCheck.brand_id)
            .eq("user_id", user.id)
            .single()

          if (!brandCheck) {
            return // Brand doesn't belong to user
          }

          if (payload.eventType === "INSERT") {
            // Add new message to appropriate chat
            const newMessage = payload.new as any
            setBrandsWithFolders((prev) =>
              prev.map((brand) => ({
                ...brand,
                folders: brand.folders.map((folder) => ({
                  ...folder,
                  chats: folder.chats.map((chat) =>
                    chat.id === newMessage.chat_id
                      ? {
                          ...chat,
                          messages: [...(chat.messages || []), newMessage],
                          updated_at: newMessage.created_at,
                        }
                      : chat,
                  ),
                })),
              })),
            )
          }
        }
      })
      .subscribe((status) => {
        console.log("[v0] Brand messages subscription status:", status)
      })

    return () => {
      console.log("[v0] Cleaning up brand folders subscriptions")
      brandsSubscription.unsubscribe()
      chatsSubscription.unsubscribe()
      messagesSubscription.unsubscribe()
    }
  }, [user])

  const createChatInBrand = async (brandId: string, agentId: string, title = "New Chat") => {
    if (!user) return null

    try {
      const chatId = generateUUID()

      // Get brand name for better chat title
      const brand = brandsWithFolders.find((b) => b.id === brandId)
      const brandName = brand?.name || "Brand"
      const finalTitle = title === "New Chat" ? `${brandName} Chat` : title

      const currentTime = new Date().toISOString()

      // Create optimistic chat object (no database write yet)
      const optimisticChat = {
        id: chatId,
        title: finalTitle,
        brand_id: brandId,
        agent_id: agentId,
        user_id: user.id,
        created_at: currentTime,
        updated_at: currentTime,
        messages: [],
      }

      // Update UI optimistically
      setBrandsWithFolders((prev) =>
        prev.map((brand) => {
          if (brand.id === brandId) {
            // Find or create the agent folder
            const existingFolderIndex = brand.folders.findIndex((folder) => folder.agent_id === agentId)

            if (existingFolderIndex >= 0) {
              // Add to existing folder
              const updatedFolders = [...brand.folders]
              updatedFolders[existingFolderIndex] = {
                ...updatedFolders[existingFolderIndex],
                chats: [optimisticChat, ...updatedFolders[existingFolderIndex].chats],
              }
              return { ...brand, folders: updatedFolders }
            } else {
              // Create new folder - get agent name asynchronously
              const client = createClient()

              // Fetch agent name for proper folder naming
              client
                .from("agents")
                .select("name")
                .eq("id", agentId)
                .single()
                .then(({ data: agent }) => {
                  const agentName = agent?.name || "Default Agent"
                  const folderName = `${agentName} Chats`

                  // Update the folder name after agent lookup
                  setBrandsWithFolders((current) =>
                    current.map((currentBrand) => {
                      if (currentBrand.id === brandId) {
                        const folderIndex = currentBrand.folders.findIndex((f) => f.agent_id === agentId)
                        if (folderIndex >= 0) {
                          const updatedFolders = [...currentBrand.folders]
                          updatedFolders[folderIndex] = {
                            ...updatedFolders[folderIndex],
                            name: folderName,
                          }
                          return { ...currentBrand, folders: updatedFolders }
                        }
                      }
                      return currentBrand
                    }),
                  )
                })
                .catch((error) => {
                  console.error("[v0] Error fetching agent name:", error)
                })

              const newFolder = {
                id: agentId,
                name: `Default Agent Chats`, // Will be updated with real agent name above
                agent_id: agentId,
                chats: [optimisticChat],
              }
              return { ...brand, folders: [...brand.folders, newFolder] }
            }
          }
          return brand
        }),
      )

      console.log("[v0] Created optimistic chat in brand:", optimisticChat)
      return optimisticChat
    } catch (error) {
      console.error("[v0] Error in createChatInBrand:", error)
      return null
    }
  }

  const deleteChatFromBrand = async (chatId: string) => {
    setBrandsWithFolders((prev) =>
      prev.map((brand) => ({
        ...brand,
        folders: brand.folders
          .map((folder) => ({
            ...folder,
            chats: folder.chats.filter((chat) => chat.id !== chatId),
          }))
          .filter((folder) => folder.chats.length > 0), // Remove empty folders
      })),
    )
  }

  return {
    brandsWithFolders,
    loading,
    createChatInBrand,
    deleteChatFromBrand,
    setBrandsWithFolders,
    refetch: fetchBrandsWithFolders, // Expose refetch function
  }
}
