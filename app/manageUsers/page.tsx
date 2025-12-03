"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { useUserProfile } from "@/hooks/use-user-profile"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, ArrowUp, ArrowDown, MoreVertical, Loader2, Search, X, UserX, UserCheck } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  first_sign_in: boolean
  first_sign_in_date: string | null
  created_at: string
  is_active: boolean
}

type SortColumn = "name" | "email" | "role" | "status" | "date"
type SortDirection = "asc" | "desc"

const BxTrash = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.33333 13.3333C3.33333 13.6869 3.47381 14.0261 3.72386 14.2761C3.97391 14.5262 4.31304 14.6666 4.66667 14.6666H11.3333C11.687 14.6666 12.0261 14.5262 12.2761 14.2761C12.5262 14.0261 12.6667 13.6869 12.6667 13.3333V5.33331H14V3.99998H11.3333V2.66665C11.3333 2.31302 11.1929 1.97389 10.9428 1.72384C10.6928 1.47379 10.3536 1.33331 10 1.33331H6C5.64638 1.33331 5.30724 1.47379 5.05719 1.72384C4.80714 1.97379 4.66667 2.31302 4.66667 2.66665V3.99998H2V5.33331H3.33333V13.3333ZM6 2.66665H10V3.99998H6V2.66665ZM5.33333 5.33331H11.3333V13.3333H4.66667V5.33331H5.33333Z"
      fill="#B1B1B1"
    />
    <path d="M6 6.66669H7.33333V12H6V6.66669ZM8.66667 6.66669H10V12H8.66667V6.66669Z" fill="#B1B1B1" />
  </svg>
)

function ManageUsersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const supabase = createClient()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sortColumn, setSortColumn] = useState<SortColumn>("role")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    if (profile && profile.role !== "Admin") {
      router.push("/")
      return
    }

    fetchUsers()
  }, [user, profile, router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, role, first_sign_in, first_sign_in_date, created_at, is_active")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[ManageUsers] Error fetching users:", error)
        toast.error("Failed to load users")
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error("[ManageUsers] Error:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortedUsers = useMemo(() => {
    let filtered = users
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = users.filter((user) => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
        const email = user.email.toLowerCase()
        return fullName.includes(query) || email.includes(query)
      })
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortColumn) {
        case "name":
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase()
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase()
          break
        case "email":
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case "role":
          aValue = a.role.toLowerCase()
          bValue = b.role.toLowerCase()
          break
        case "status":
          aValue = !a.is_active ? "suspended" : a.first_sign_in ? "invited" : "active"
          bValue = !b.is_active ? "suspended" : b.first_sign_in ? "invited" : "active"
          break
        case "date":
          aValue = a.first_sign_in_date || ""
          bValue = b.first_sign_in_date || ""
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    if (sortColumn === "role" && sortDirection === "asc") {
      return sorted.sort((a, b) => {
        if (a.role === b.role) {
          const aName = `${a.first_name} ${a.last_name}`.toLowerCase()
          const bName = `${b.first_name} ${b.last_name}`.toLowerCase()
          return aName.localeCompare(bName)
        }
        return a.role === "Admin" ? -1 : 1
      })
    }

    return sorted
  }, [users, sortColumn, sortDirection, searchQuery])

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId)

    const userToUpdate = users.find((u) => u.id === userId)
    const oldRole = userToUpdate?.role
    const updateRoleUrl =
      process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
        ? "https://paidadvertising.app.n8n.cloud/webhook/c64488a5-e6da-4112-b7b1-1b4567ddcb7e"
        : "https://paidadvertising.app.n8n.cloud/webhook/0d1b15c8-da98-4ed0-8e35-0510ca4c7cd7";

    try {
      const response = await fetch(
        updateRoleUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            new_role: newRole,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to update role: ${response.status}`)
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))

      if (userToUpdate) {
        toast.success(
          `User, ${userToUpdate.first_name} ${userToUpdate.last_name}'s role, has been updated from "${oldRole}" to "${newRole}"`,
        )
      }
    } catch (error) {
      console.error("[ManageUsers] Error updating role:", error)
      toast.error("Failed to update user role")
    } finally {
      setUpdatingRole(null)
    }
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const suspendUserUrl =
    process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
      ? "https://paidadvertising.app.n8n.cloud/webhook/044e02bb-3827-497b-8a15-b75fc9b95717"
      : "https://paidadvertising.app.n8n.cloud/webhook/7ad1efd4-f4b5-407c-84b7-0c23317de467";
  const handleSuspendUser = async (user: User) => {
    try {
      const response = await fetch(
        suspendUserUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_email: user.email,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to suspend user: ${response.status}`)
      }

      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: false } : u)))

      toast.success(`User ${user.first_name} ${user.last_name} has been suspended`)
    } catch (error) {
      console.error("[ManageUsers] Error suspending user:", error)
      toast.error("Failed to suspend user")
    }
  }

  const activateUserUrl =
    process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
      ? "https://paidadvertising.app.n8n.cloud/webhook/da575104-315f-44f7-a645-72ba7354b71c"
      : "https://paidadvertising.app.n8n.cloud/webhook/bb3eaf39-7a34-4553-9e23-a0a5a5579064";
  const handleActivateUser = async (user: User) => {
    try {
      const response = await fetch(
        activateUserUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_email: user.email,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to activate user: ${response.status}`)
      }

      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: true } : u)))

      toast.success(`User ${user.first_name} ${user.last_name} has been activated`)
    } catch (error) {
      console.error("[ManageUsers] Error activating user:", error)
      toast.error("Failed to activate user")
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not yet joined"

    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUp className="w-3 h-3 text-[#B1B1B1] opacity-30" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-blue-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-400" />
    )
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    const deleteUserUrl =
      process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
        ? "https://paidadvertising.app.n8n.cloud/webhook/474594fe-04ca-40b7-8edc-b6eac7cfb460"
        : "https://paidadvertising.app.n8n.cloud/webhook/51817fc5-8e84-458f-b137-25ce6f31950c";

    try {
      const response = await fetch(
        deleteUserUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userToDelete.id,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status}`)
      }

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
      toast.success(`User ${userToDelete.first_name} ${userToDelete.last_name} has been deleted`)
    } catch (error) {
      console.error("[ManageUsers] Error deleting user:", error)
      toast.error("Failed to delete user")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white relative">
      <div className="absolute inset-0">
        <img
          src="/images/design-mode/Mono-Glass2%201.png%281%29%281%29.jpeg"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#111111]/60 backdrop-blur-[6px]"></div>
        <div className="absolute inset-0 bg-[#171717]/40 backdrop-blur-[8px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-8">
        <div className="flex items-center gap-2 mb-8">
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="text-white hover:text-white hover:bg-gray-200/20 p-2 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5 text-white hover:text-white" />
            <span className="text-sm">Back</span>
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#B1B1B1]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-[#1a1a1a] border border-[#3E3E3E] placeholder-[#B1B1B1] text-white focus:border-[#3E3E3E] focus:bg-[#1a1a1a] rounded-lg transition-all duration-150"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  searchInputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B1B1B1] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="backdrop-blur-xl bg-black/40 rounded-xl border border-[#3E3E3E] overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1.5fr_auto] gap-4 px-6 py-4 bg-[#2a2a2a]/50 border-b border-[#3E3E3E]">
            <button
              onClick={() => handleSort("name")}
              className="flex items-center gap-2 text-left text-sm font-medium text-white hover:text-blue-400 transition-colors"
            >
              Name
              <SortIcon column="name" />
            </button>
            <button
              onClick={() => handleSort("email")}
              className="flex items-center gap-2 text-left text-sm font-medium text-white hover:text-blue-400 transition-colors"
            >
              Email
              <SortIcon column="email" />
            </button>
            <button
              onClick={() => handleSort("role")}
              className="flex items-center gap-2 text-left text-sm font-medium text-white hover:text-blue-400 transition-colors"
            >
              Role
              <SortIcon column="role" />
            </button>
            <button
              onClick={() => handleSort("status")}
              className="flex items-center gap-2 text-left text-sm font-medium text-white hover:text-blue-400 transition-colors"
            >
              Status
              <SortIcon column="status" />
            </button>
            <button
              onClick={() => handleSort("date")}
              className="flex items-center gap-2 text-left text-sm font-medium text-white hover:text-blue-400 transition-colors"
            >
              Date Joined
              <SortIcon column="date" />
            </button>
            <div className="w-8"></div>
          </div>

          <div className="divide-y divide-[#3E3E3E]/30">
            {sortedUsers.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_1.5fr_auto] gap-4 px-6 py-4 hover:bg-white/5 transition-colors items-center"
              >
                <div className="text-sm text-white">
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-sm text-[#B1B1B1]">{user.email}</div>
                <div>
                  <Select
                    value={user.role}
                    onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                    disabled={updatingRole === user.id || user.id === profile?.id}
                  >
                    <SelectTrigger className="text-white px-3 h-8 text-sm rounded-lg bg-[#2a2a2a] border border-white/10 hover:bg-[#333333] transition-colors w-full">
                      {updatingRole === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <SelectValue />}
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2a2a] border border-white/10 text-white">
                      <SelectItem value="Admin" className="hover:bg-white/5 focus:bg-white/5">
                        Admin
                      </SelectItem>
                      <SelectItem value="User" className="hover:bg-white/5 focus:bg-white/5">
                        User
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      !user.is_active
                        ? "bg-red-500/20 text-red-400"
                        : user.first_sign_in
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {!user.is_active ? "Suspended" : user.first_sign_in ? "Invited" : "Active"}
                  </span>
                </div>
                <div className="text-sm text-[#B1B1B1]">{formatDate(user.first_sign_in_date)}</div>
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        disabled={user.id === profile?.id}
                        className="text-[#B1B1B1] hover:text-white hover:bg-white/10 p-2 h-8 w-8 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-md inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                        aria-label="User options"
                        title="User options"
                      >
                        <MoreVertical className="w-4 h-4 pointer-events-none" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="bg-[#2a2a2a] border border-white/10 text-white min-w-[200px] z-[100]"
                      align="end"
                      sideOffset={5}
                    >
                      {user.is_active ? (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSuspendUser(user)
                          }}
                          className="hover:bg-white/10 focus:bg-white/10 cursor-pointer flex items-center gap-2"
                        >
                          <UserX className="w-4 h-4" />
                          Suspend {user.first_name}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleActivateUser(user)
                          }}
                          className="hover:bg-white/10 focus:bg-white/10 cursor-pointer flex items-center gap-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          Activate {user.first_name}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteUser(user)
                        }}
                        className="hover:bg-red-400/10 focus:bg-red-400/10 text-red-400 cursor-pointer flex items-center gap-2"
                      >
                        <BxTrash />
                        Delete {user.first_name}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {sortedUsers.length === 0 && (
            <div className="text-center py-12 text-[#B1B1B1]">
              {searchQuery.trim() ? "No users found matching your search" : "No users found"}
            </div>
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#2a2a2a]/95 border border-white/10 text-white">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[20px] -z-10" />
          <DialogHeader>
            <DialogTitle className="text-white">Delete User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-white">
              Are you sure you want to delete user{" "}
              <strong>
                {userToDelete?.first_name} {userToDelete?.last_name}
              </strong>
              ?
            </p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm font-medium mb-1">Warning</p>
              <p className="text-[#B1B1B1] text-sm">
                This action cannot be undone. All data associated with this user will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="flex-1 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteUser}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete User"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManageUsersPage
