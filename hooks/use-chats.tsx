"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

export interface Chat {
  id: string
  title: string
  agent_id: string | null
  brand_id: string | null
  user_id: string
  created_at: string
  updated_at: string
  thread_id?: string // Added thread_id field to Chat interface
  messages: Message[]
}

export interface Message {
  id: string
  chat_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
  attachments?: string[]
  attachments_names?: string[] // Added attachments_names field to store actual file names
}

export function useChats() {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    console.log("[v0] useChats: chats state updated, count:", chats.length)
    console.log(
      "[v0] useChats: chats:",
      chats.map((c) => ({ id: c.id, title: c.title, messages: c.messages.length, brand_id: c.brand_id })),
    )
  }, [chats])

  useEffect(() => {
    if (!user) {
      setChats([])
      setLoading(false)
      return
    }

    const fetchChats = async () => {
      try {
        console.log("[v0] Fetching chats for user:", user.id)

        // First, let's check if there are any chats at all in the database
        const { data: allChats, error: allChatsError } = await supabase.from("chats").select("*").limit(10)

        console.log("[v0] All chats in database (first 10):", allChats)
        if (allChatsError) {
          console.error("[v0] Error fetching all chats:", allChatsError)
        }

        // Now try to fetch chats for this specific user
        const { data: chatsData, error: chatsError } = await supabase
          .from("chats")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })

        if (chatsError) {
          console.error("[v0] Error fetching user chats:", chatsError)
          setChats([])
          setLoading(false)
          return
        }

        console.log("[v0] Fetched user chats:", chatsData)
        console.log("[v0] User ID being searched:", user.id)

        // Fetch messages for each chat
        const chatsWithMessages = await Promise.all(
          (chatsData || []).map(async (chat) => {
            const { data: messagesData, error: messagesError } = await supabase
              .from("messages")
              .select("*")
              .eq("chat_id", chat.id)
              .order("created_at", { ascending: true })

            if (messagesError) {
              console.error("[v0] Error fetching messages for chat:", chat.id, messagesError)
              return { ...chat, messages: [] }
            }

            return { ...chat, messages: messagesData || [] }
          }),
        )

        console.log("[v0] useChats: Setting chats state with", chatsWithMessages.length, "chats")
        setChats(chatsWithMessages)
      } catch (error) {
        console.error("[v0] Error in fetchChats:", error)
        setChats([])
      } finally {
        setLoading(false)
      }
    }

    fetchChats()

    console.log("[v0] Setting up real-time subscriptions for user:", user.id)

    // Set up real-time subscription for chats
    const chatsSubscription = supabase
      .channel(`chats_changes_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats", filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log("[v0] Chat change detected:", payload)
          console.log("[v0] Chat change event type:", payload.eventType)
          console.log("[v0] Chat change data:", payload.new || payload.old)
          // Refetch all chats when there's a change
          fetchChats()
        },
      )
      .subscribe((status) => {
        console.log("[v0] Chats subscription status:", status)
      })

    // Set up real-time subscription for messages (listen to all messages, filter in callback)
    const messagesSubscription = supabase
      .channel(`messages_changes_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        console.log("[v0] Message change detected:", payload)
        console.log("[v0] Message change event type:", payload.eventType)
        console.log("[v0] Message change data:", payload.new || payload.old)
        // Only refetch if the message belongs to one of the user's chats
        fetchChats()
      })
      .subscribe((status) => {
        console.log("[v0] Messages subscription status:", status)
      })

    return () => {
      console.log("[v0] Cleaning up subscriptions")
      chatsSubscription.unsubscribe()
      messagesSubscription.unsubscribe()
    }
  }, [user, supabase])

  const createChat = async (title: string, agentId?: string, brandId?: string) => {
    if (!user) return null

    try {
      const { data: chatData, error: chatError } = await supabase
        .from("chats")
        .insert({
          title,
          agent_id: agentId || null,
          brand_id: brandId || null,
          user_id: user.id,
        })
        .select()
        .single()

      if (chatError) {
        console.error("[v0] Error creating chat:", chatError)
        return null
      }

      console.log("[v0] Created new chat:", chatData)
      return chatData
    } catch (error) {
      console.error("[v0] Error in createChat:", error)
      return null
    }
  }

  const sendMessage = async (
    chatId: string,
    content: string,
    role: "user" | "assistant" = "user",
    attachments?: string[],
    attachmentsNames?: string[], // Added attachments_names parameter
  ) => {
    if (!user) return null

    try {
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          role,
          content,
          attachments: attachments || [],
          attachments_names: attachmentsNames || [], // Include attachments_names in database insert
        })
        .select()
        .single()

      if (messageError) {
        console.error("[v0] Error sending message:", messageError)
        return null
      }

      console.log("[v0] Sent message:", messageData)

      // Update chat's updated_at timestamp
      await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId)

      return messageData
    } catch (error) {
      console.error("[v0] Error in sendMessage:", error)
      return null
    }
  }

  const deleteChat = async (chatId: string) => {
    if (!user) return false

    try {
      // Delete messages first (due to foreign key constraint)
      await supabase.from("messages").delete().eq("chat_id", chatId)

      // Then delete the chat
      const { error: chatError } = await supabase.from("chats").delete().eq("id", chatId).eq("user_id", user.id) // Ensure user can only delete their own chats

      if (chatError) {
        console.error("[v0] Error deleting chat:", chatError)
        return false
      }

      console.log("[v0] Deleted chat:", chatId)
      return true
    } catch (error) {
      console.error("[v0] Error in deleteChat:", error)
      return false
    }
  }

  return {
    chats,
    loading,
    createChat,
    sendMessage,
    deleteChat,
    setChats, // Export setChats for optimistic updates
  }
}
