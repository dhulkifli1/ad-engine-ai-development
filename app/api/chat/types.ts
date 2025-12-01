// app/api/chat/types.ts

export interface ChatMessage {
  id: string;
  chat_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  attachments?: string[];
  attachments_names?: string[];
}

export interface Chat {
  id: string;
  user_id: string;
  brand_id?: string;
  agent_id?: string;
  title: string;
  created_at: string;
  updated_at: string;
  thread_id?: string;
  vs_id?: string;
}

export interface ChatPayload {
  messages: ChatMessage;
  chats: Chat;
  assistant_id?: string;
}

export interface FileMetadata {
  url: string;
  fileName: string;
  fileExtension: string;
  fileType: 'image' | 'pdf' | 'document' | 'spreadsheet';
  fileCategory: string;
}

export interface OpenAIFileUpload {
  id: string;
  filename: string;
  bytes: number;
  purpose: string;
}

export interface VectorStoreResponse {
  id: string;
  object: string;
  created_at: number;
  name: string;
  status: 'completed' | 'in_progress' | 'expired';
  file_counts: {
    in_progress: number;
    completed: number;
    failed: number;
    cancelled: number;
    total: number;
  };
  expires_after?: {
    anchor: string;
    days: number;
  };
  expires_at?: number;
}

export interface AssistantResponse {
  success: boolean;
  thread_id: string;
  assistant_response: string;
  message_id: string;
  run_id: string;
  timestamp: string;
}

export interface AgentContext {
  sortedMessages: Array<{ role: string; content: string }>;
  lastMessage: string;
  attachmentDescription?: {
    description: string;
    Text: string;
  };
}
