"use client"

import { Search, Bell, Calendar, Filter, MoreHorizontal, Edit, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface BrandDashboardProps {
  brandName: string
  brandIcon: string
  brandColor: string
}

export function BrandDashboard({ brandName, brandIcon, brandColor }: BrandDashboardProps) {
  const [activeTab, setActiveTab] = useState("Concepts")
  const [searchQuery, setSearchQuery] = useState("")

  const tabs = ["Overview", "Concepts", "Product", "Profile"]

  const conceptsData = [
    {
      id: "WU-1",
      status: "To Build",
      conceptName: "Eco-Conscious Cotton",
      desire: "I want to find sustainable clothes",
      date: "Jan 13, 2026",
      awarenessLevel: "Product-Aware",
      results: "Poor CPA",
    },
    {
      id: "WU-2",
      status: "Tested",
      conceptName: "Woman burning fabric",
      desire: "I want to find affordable soft clothing",
      date: "Jan 13, 2026",
      awarenessLevel: "Problem-Aware",
      results: "Winner",
    },
  ]

  return (
    <div className="flex-1 flex flex-col bg-[#171717]/70 backdrop-blur-sm">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${brandColor} rounded-full flex items-center justify-center`}>
            <span className="text-lg font-bold text-white">{brandIcon}</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">{brandName}</h1>
        </div>
        <Bell className="w-5 h-5 text-[#FAFAFA]" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-8 px-6 py-4 border-b border-[#3e3e3e]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-medium transition-colors ${
              activeTab === tab ? "text-white border-b-2 border-white pb-2" : "text-[#B1B1B1] hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6">
        {activeTab === "Concepts" && (
          <div className="space-y-6">
            {/* Concepts Header */}
            <h2 className="text-3xl font-bold text-white">Concepts</h2>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#B1B1B1]" />
                <Input
                  placeholder="Search a research result..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#2a2a2a] border-[#3e3e3e] text-white placeholder-[#B1B1B1] focus:border-white"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#3e3e3e] rounded-md">
                <Calendar className="w-4 h-4 text-[#B1B1B1]" />
                <span className="text-sm text-[#B1B1B1]">Jan 6, 2026 - Jan 13, 2022</span>
              </div>
              <Button variant="ghost" size="sm" className="text-[#B1B1B1] hover:text-white">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-[#B1B1B1] hover:text-white">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              <Button className="bg-[#CCAE7C] hover:bg-[#CCAE7C]/90 text-black font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Create New Concept
              </Button>
            </div>

            {/* Data Table */}
            <div className="bg-[#2a2a2a] rounded-lg border border-[#3e3e3e] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#1a1a1a] border-b border-[#3e3e3e]">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">
                      <input type="checkbox" className="w-4 h-4" />
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">ID</th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">Concept Name</th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">Desire</th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">Date</th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">Awareness Level</th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">Results</th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]"></th>
                  </tr>
                </thead>
                <tbody>
                  {conceptsData.map((concept, index) => (
                    <tr key={concept.id} className="border-b border-[#3e3e3e] hover:bg-[#1a1a1a]">
                      <td className="p-4">
                        <input type="checkbox" className="w-4 h-4" />
                      </td>
                      <td className="p-4 text-sm text-white">{concept.id}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            concept.status === "To Build"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {concept.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-white">{concept.conceptName}</td>
                      <td className="p-4 text-sm text-[#B1B1B1]">{concept.desire}</td>
                      <td className="p-4 text-sm text-[#B1B1B1]">{concept.date}</td>
                      <td className="p-4 text-sm text-[#B1B1B1]">{concept.awarenessLevel}</td>
                      <td className="p-4">
                        <span
                          className={`text-sm font-medium ${
                            concept.results === "Winner" ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {concept.results}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" className="text-[#B1B1B1] hover:text-white">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Other tab content placeholders */}
        {activeTab !== "Concepts" && (
          <div className="flex items-center justify-center h-64">
            <p className="text-[#B1B1B1] text-lg">{activeTab} content coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}
