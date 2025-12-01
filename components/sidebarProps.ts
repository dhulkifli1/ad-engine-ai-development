export interface SidebarProps {
  chats: Array<{
    id: string
    title: string
    messages: Array<{
      id: string
      content: string
      role: "user" | "assistant"
      timestamp: Date
    }>
  }>
  activeChat: string
  onChatSelect: (id: string) => void
  onNewChat: () => void
}
