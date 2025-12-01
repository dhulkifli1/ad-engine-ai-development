"use client"

import { Search, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react"

const BxFilter = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.6665 7.33335H11.3332V8.66669H4.6665V7.33335ZM2.6665 4.66669H13.3332V6.00002H2.6665V4.66669ZM6.6665 10H9.33317V11.3334H6.6665V10Z"
      fill="#B1B1B1"
    />
  </svg>
)

const BxTrash = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.33333 13.3333C3.33333 13.6869 3.47381 14.0261 3.72386 14.2761C3.97391 14.5262 4.31304 14.6666 4.66667 14.6666H11.3333C11.687 14.6666 12.0261 14.5262 12.2761 14.2761C12.5262 14.0261 12.6667 13.6869 12.6667 13.3333V5.33331H14V3.99998H11.3333V2.66665C11.3333 2.31302 11.1929 1.97389 10.9428 1.72384C10.6928 1.47379 10.3536 1.33331 10 1.33331H6C5.64638 1.33331 5.30724 1.47379 5.05719 1.72384C4.80714 1.97389 4.66667 2.31302 4.66667 2.66665V3.99998H2V5.33331H3.33333V13.3333ZM6 2.66665H10V3.99998H6V2.66665ZM5.33333 5.33331H11.3333V13.3333H4.66667V5.33331H5.33333Z"
      fill="#B1B1B1"
    />
    <path d="M6 6.66669H7.33333V12H6V6.66669ZM8.66667 6.66669H10V12H8.66667V6.66669Z" fill="#B1B1B1" />
  </svg>
)

const BxSliderAlt = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.55792 4.93333C8.26859 3.97333 7.38659 3.26666 6.33325 3.26666C5.27992 3.26666 4.39792 3.97333 4.10859 4.93333H1.33325V6.26666H4.10859C4.39792 7.22666 5.27992 7.93333 6.33325 7.93333C7.38659 7.93333 8.26859 7.22666 8.55792 6.26666H14.7499V4.93333H8.55792ZM6.33325 6.6C5.78192 6.6 5.33325 6.15133 5.33325 5.6C5.33325 5.04866 5.78192 4.6 6.33325 4.6C6.88459 4.6 7.33325 5.04866 7.33325 5.6C7.33325 6.15133 6.88459 6.6 6.33325 6.6Z"
      fill="#B1B1B1"
    />
    <path
      d="M7.52533 10.5333C7.81467 9.57334 8.69667 8.86667 9.75 8.86667C10.8033 8.86667 11.6853 9.57334 11.9747 10.5333H14.75V11.8667H11.9747C11.6853 12.8267 10.8033 13.5333 9.75 13.5333C8.69667 13.5333 7.81467 12.8267 7.52533 11.8667H1.33333V10.5333H7.52533ZM9.75 12.2C10.3013 12.2 10.75 11.7513 10.75 11.2C10.75 10.6487 10.3013 10.2 9.75 10.2C9.19867 10.2 8.75 10.6487 8.75 11.2C8.75 11.7513 9.19867 12.2 9.75 12.2Z"
      fill="#FAFAFA"
    />
  </svg>
)

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M19 13.586V10C19 6.783 16.815 4.073 13.855 3.258C13.562 2.52 12.846 2 12 2C11.154 2 10.438 2.52 10.145 3.258C7.185 4.074 5 6.783 5 10V13.586L3.293 15.293C3.19996 15.3857 3.12617 15.4959 3.07589 15.6172C3.0256 15.7386 2.99981 15.8687 3 16V18C3 18.2652 3.10536 18.5196 3.29289 18.7071C3.48043 18.8946 3.73478 19 4 19H20C20.2652 19 20.5196 18.8946 21 18.7071C21.1875 18.5196 21.2929 18.2652 21.2929 18V16C21.2929 15.8687 21.2671 15.7386 21.2168 15.6172C21.1665 15.4959 21.0927 15.3857 21 15.293L19 13.586ZM19 17H5V16.414L6.707 14.707C6.80004 14.6143 6.87383 14.5041 6.92412 14.3828C6.9744 14.2614 7.00019 14.1313 7 14V10C7 7.243 9.243 5 12 5C14.757 5 17 7.243 17 10V14C17 14.266 17.105 14.52 17.293 14.707L19 16.414V17ZM12 22C12.6193 22.0008 13.2235 21.8086 13.7285 21.4502C14.2335 21.0917 14.6143 20.5849 14.818 20H9.182C9.38566 20.5849 9.76648 21.0917 10.2715 21.4502C10.7765 21.8086 11.3807 22.0008 12 22Z"
      fill="#FAFAFA"
    />
  </svg>
)

const WriteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z"
      fill="#B1B1B1"
    />
  </svg>
)

const CollapseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill="#FAFAFA" />
  </svg>
)

interface BrandBottomSheetProps {
  brandName: string
  brandIcon: string
  brandColor: string
  brandImage?: string
  brandDescription?: string
  onClose: () => void
}

export default function BrandBottomSheet({
  brandName,
  brandIcon,
  brandColor,
  brandImage,
  brandDescription,
  onClose,
}: BrandBottomSheetProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [activeTab, setActiveTab] = useState("Concepts")
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    const handleScroll = () => {
      if (scrollElement.scrollTop > 10 && !isExpanded) {
        setIsExpanded(true)
        window.dispatchEvent(
          new CustomEvent("bottomSheetExpansion", {
            detail: { isExpanded: true },
          }),
        )
      }
    }

    scrollElement.addEventListener("scroll", handleScroll)
    return () => scrollElement.removeEventListener("scroll", handleScroll)
  }, [isExpanded])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("bottomSheetExpansion", {
        detail: { isExpanded: false },
      }),
    )
  }, [])

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([])
      setSelectAll(false)
    } else {
      setSelectedItems(["WU-1", "WU-2"])
      setSelectAll(true)
    }
  }

  const handleItemSelect = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      const newSelected = selectedItems.filter((id) => id !== itemId)
      setSelectedItems(newSelected)
      setSelectAll(false)
    } else {
      const newSelected = [...selectedItems, itemId]
      setSelectedItems(newSelected)
      setSelectAll(newSelected.length === 2)
    }
  }

  const handleCollapse = () => {
    setIsExpanded(false)
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
    window.dispatchEvent(
      new CustomEvent("bottomSheetExpansion", {
        detail: { isExpanded: false },
      }),
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <div className="p-6 mx-3.5">
            <h3 className="text-2xl font-semibold text-white mb-6">Overview</h3>
            {brandDescription ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Description</h4>
                  <p className="text-[#B1B1B1] leading-relaxed">{brandDescription}</p>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Brand Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-[#777777]">Brand Name</span>
                      <p className="text-white">{brandName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-[#777777]">Status</span>
                      <p className="text-green-400">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[#B1B1B1]">No description available for this brand.</p>
            )}
          </div>
        )
      case "Product":
        return (
          <div className="p-6 mx-3.5">
            <h3 className="text-2xl font-semibold text-white mb-6">Product</h3>
            <p className="text-[#B1B1B1]">Product information coming soon...</p>
          </div>
        )
      case "Profile":
        return (
          <div className="p-6 mx-3.5">
            <h3 className="text-2xl font-semibold text-white mb-6">Profile</h3>
            <p className="text-[#B1B1B1]">Profile details coming soon...</p>
          </div>
        )
      default:
        return (
          <div className="p-6 mx-3.5">
            <h3 className="text-2xl font-semibold text-white mb-6">Concepts</h3>

            {/* Search and filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#B1B1B1]" />
                <Input
                  placeholder="Search a research result..."
                  className="pl-10 bg-[#171717]/50 border-[#3e3e3e] text-white placeholder-[#B1B1B1] focus:border-white"
                />
              </div>
              <div className="flex items-center gap-2 bg-[#171717]/50 border border-[#3e3e3e] rounded-md px-3 py-2">
                <Calendar className="w-4 h-4 text-[#B1B1B1]" />
                <span className="text-sm text-[#B1B1B1]">Jan 6, 2026 - Jan 13, 2022</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-white/10 p-2 transition-all duration-200"
                >
                  <BxFilter />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-white/10 p-2 transition-all duration-200"
                >
                  <BxTrash />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-white/10 p-2 transition-all duration-200"
                >
                  <BxSliderAlt />
                </Button>
              </div>
              <Button className="bg-[#171717]/50 hover:bg-[#3a3a3a] text-white border border-[#3e3e3e] ml-auto">
                + Create New Concept
              </Button>
            </div>

            {/* Table */}
            <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#2a2a2a]">
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-2 border-[#777777] bg-transparent appearance-none checked:bg-transparent checked:border-[#777777] cursor-pointer relative"
                          style={{
                            backgroundImage: selectAll
                              ? `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e")`
                              : "none",
                          }}
                        />
                        <span>ID</span>
                      </div>
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">Concept Name</th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">Desire</th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">Date</th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">Awareness Level</th>
                    <th className="text-left p-4 text-sm font-medium text-[#B1B1B1]">Results</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-[#2a2a2a]">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes("WU-1")}
                          onChange={() => handleItemSelect("WU-1")}
                          className="w-4 h-4 rounded border-2 border-[#777777] bg-transparent appearance-none checked:bg-transparent checked:border-[#777777] cursor-pointer"
                          style={{
                            backgroundImage: selectedItems.includes("WU-1")
                              ? `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e")`
                              : "none",
                          }}
                        />
                        <span className="text-white text-sm">WU-1</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white text-sm">To Build</span>
                    </td>
                    <td className="p-4 text-white text-sm">Eco-Conscious Cotton</td>
                    <td className="p-4 text-white text-sm">I want to find sustainable clothes</td>
                    <td className="p-4 text-[#B1B1B1] text-sm">Jan 13, 2026</td>
                    <td className="p-4 text-[#B1B1B1] text-sm">Product-Aware</td>
                    <td className="p-4 text-white text-sm">Poor CPA</td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-300 hover:text-white hover:bg-white/10 p-1 transition-all duration-200"
                      >
                        <WriteIcon />
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#2a2a2a]">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes("WU-2")}
                          onChange={() => handleItemSelect("WU-2")}
                          className="w-4 h-4 rounded border-2 border-[#777777] bg-transparent appearance-none checked:bg-transparent checked:border-[#777777] cursor-pointer"
                          style={{
                            backgroundImage: selectedItems.includes("WU-2")
                              ? `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e")`
                              : "none",
                          }}
                        />
                        <span className="text-white text-sm">WU-2</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white text-sm">Tested</span>
                    </td>
                    <td className="p-4 text-white text-sm">Woman burning fabric</td>
                    <td className="p-4 text-white text-sm">I want to find affordable soft clothing</td>
                    <td className="p-4 text-[#B1B1B1] text-sm">Jan 13, 2026</td>
                    <td className="p-4 text-[#B1B1B1] text-sm">Problem-Aware</td>
                    <td className="p-4 text-white text-sm">Winner</td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-300 hover:text-white hover:bg-white/10 p-1 transition-all duration-200"
                      >
                        <WriteIcon />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
    }
  }

  const getBrandImage = (name: string, imageUrl?: string) => {
    // First check if we have a direct image URL
    if (imageUrl) {
      return imageUrl
    }

    // Then check static brand images
    switch (name.toLowerCase()) {
      case "wama underwear":
        return "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/wama-lKQii32GVpVZbqMHE5UpFzZXWSh5iA.png"
      case "ctrl":
        return "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ctrl-N50elInvggUXy74e6fuKCdarjMVCG7.png"
      default:
        return null
    }
  }

  const displayImage = getBrandImage(brandName, brandImage)

  return (
    <>
      <div
        className={`absolute bottom-0 left-0 right-0 ${isExpanded ? "h-[350px]" : "h-[200px]"} bg-[#1a1a1a]/90 backdrop-blur-[12px] border-t border-l border-r border-[#3E3E3E] rounded-t-[16px] mx-8 z-50 flex flex-col transition-all duration-500 ease-out transform ${isExpanded ? "translate-y-0" : "translate-y-0"}`}
        style={{
          transition: "height 0.4s cubic-bezier(0.4, 0.0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 flex-shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {displayImage ? (
                <img src={displayImage || "/placeholder.svg"} alt={brandName} className="w-6 h-6 object-contain" />
              ) : (
                <div className={`w-6 h-6 ${brandColor} rounded-full flex items-center justify-center`}>
                  <span className="text-xs font-bold text-white">{brandIcon}</span>
                </div>
              )}
              <h2 className="text-lg font-semibold text-white">{brandName}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("Overview")}
                className={`text-sm px-3 py-1 ${activeTab === "Overview" ? "text-white border border-[#3E3E3E] rounded-lg bg-[#171717]" : "text-[#B1B1B1] hover:text-white"}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("Concepts")}
                className={`text-sm px-3 py-1 ${activeTab === "Concepts" ? "text-white border border-[#3E3E3E] rounded-lg bg-[#171717]" : "text-[#B1B1B1] hover:text-white"}`}
              >
                Concepts
              </button>
              <button
                onClick={() => setActiveTab("Product")}
                className={`text-sm px-3 py-1 ${activeTab === "Product" ? "text-white border border-[#3E3E3E] rounded-lg bg-[#171717]" : "text-[#B1B1B1] hover:text-white"}`}
              >
                Product
              </button>
              <button
                onClick={() => setActiveTab("Profile")}
                className={`text-sm px-3 py-1 ${activeTab === "Profile" ? "text-white border border-[#3E3E3E] rounded-lg bg-[#171717]" : "text-[#B1B1B1] hover:text-white"}`}
              >
                Profile
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BellIcon />
            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapse}
                className="text-gray-300 hover:text-white hover:bg-white/10 p-2 transition-all duration-200"
              >
                <CollapseIcon />
              </Button>
            )}
          </div>
        </div>

        <div className="border-b border-[#3e3e3e] mx-6"></div>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-custom"
          style={{
            scrollBehavior: "smooth",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255, 255, 255, 0.2) transparent",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {renderTabContent()}
        </div>
      </div>
    </>
  )
}

export { BrandBottomSheet }
