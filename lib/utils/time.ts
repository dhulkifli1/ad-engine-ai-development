export function getTimeBasedGreeting(firstName?: string, displayName?: string): string {
  const hour = new Date().getHours()
  let greeting = "Good morning"

  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon"
  } else if (hour >= 17 || hour < 6) {
    greeting = "Good evening"
  }

  console.log("[v0] Current hour:", hour, "Greeting:", greeting, "First name:", firstName, "Display name:", displayName)

  return firstName ? `${greeting}, ${firstName}` : displayName ? `${greeting}, ${displayName}` : greeting
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName) return "U"

  const first = firstName.charAt(0).toUpperCase()
  const last = lastName ? lastName.charAt(0).toUpperCase() : ""

  return first + last
}

export function getThemeColor(name?: string): string {
  if (!name) return "bg-gray-500"

  // Generate consistent color based on name
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-teal-500",
  ]

  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}
