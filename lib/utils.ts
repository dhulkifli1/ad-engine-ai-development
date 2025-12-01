import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a UUID with fallback for browsers that don't support crypto.randomUUID()
 * Ensures compatibility across all browsers and operating systems
 */
export function generateUUID(): string {
  // Try native crypto.randomUUID() first (modern browsers)
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID()
    } catch (error) {
      console.warn("[v0] crypto.randomUUID() failed, using fallback")
    }
  }

  // Fallback for older browsers or non-secure contexts
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Checks if the modifier key (Cmd on Mac, Ctrl on Windows/Linux) is pressed
 * Ensures keyboard shortcuts work consistently across operating systems
 */
export function isModifierKeyPressed(event: KeyboardEvent): boolean {
  // On Mac, metaKey is Cmd; on Windows/Linux, ctrlKey is Ctrl
  return event.metaKey || event.ctrlKey
}
