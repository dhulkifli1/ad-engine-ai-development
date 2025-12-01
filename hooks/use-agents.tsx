"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Agent {
  id: string
  name: string
  assistant_id: string
  created_at: string
  updated_at: string
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchAgents = async () => {
      try {
        console.log("[v0] Fetching all agents from database")

        const { data: agentsData, error } = await supabase.from("agents").select("*").order("name", { ascending: true })

        if (error) {
          console.error("[v0] Error fetching agents:", error)
          return
        }

        console.log("[v0] Fetched agents:", agentsData)
        setAgents(agentsData || [])
      } catch (error) {
        console.error("[v0] Error in fetchAgents:", error)
        setAgents([])
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()

    // Set up real-time subscription for agents
    const agentsSubscription = supabase
      .channel("agents_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "agents" }, (payload) => {
        console.log("[v0] Agent update detected:", payload)
        fetchAgents() // Refetch all agents on any change
      })
      .subscribe()

    return () => {
      agentsSubscription.unsubscribe()
    }
  }, [])

  return {
    agents,
    loading,
  }
}
