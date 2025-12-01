"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function ChatSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-transparent h-full">
      <div className="flex-1 overflow-y-auto scrollbar-custom px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* User message skeleton */}
          <div className="flex justify-end">
            <div className="max-w-[80%] p-4 rounded-lg bg-[#3e3e3e]/50">
              <Skeleton className="h-4 w-48 bg-white/10 mb-2" />
              <Skeleton className="h-4 w-32 bg-white/10" />
              <Skeleton className="h-3 w-16 bg-white/5 mt-2" />
            </div>
          </div>

          {/* AI message skeleton */}
          <div className="flex justify-start">
            <div className="max-w-[80%] p-4 rounded-lg bg-[#202020]/50 border border-white/5">
              <Skeleton className="h-4 w-64 bg-white/10 mb-2" />
              <Skeleton className="h-4 w-56 bg-white/10 mb-2" />
              <Skeleton className="h-4 w-40 bg-white/10 mb-2" />
              <Skeleton className="h-3 w-16 bg-white/5 mt-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-12 w-full bg-white/10 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
