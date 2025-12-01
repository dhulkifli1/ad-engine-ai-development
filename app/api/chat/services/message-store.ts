// app/api/chat/services/message-store.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import type { ChatMessage, Chat } from '@/app/api/chat/types';

export async function getChatHistory(chatId: string): Promise<Array<{ role: string; content: string }>> {
  console.log('[MessageStore] Getting chat history for:', chatId);
  
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('messages')
    .select('content, role, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[MessageStore] Error fetching history:', error);
    return [];
  }

  console.log('[MessageStore] ✓ Found', data?.length || 0, 'messages');
  
  return (data || []).map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

export async function saveUserMessage(message: ChatMessage): Promise<void> {
  console.log('[MessageStore] Saving user message:', message.id);
  
  const supabase = await createClient();

  const { error } = await supabase.from('messages').insert({
    id: message.id,
    chat_id: message.chat_id,
    content: message.content,
    role: message.role,
    created_at: message.created_at,
    attachments: message.attachments,
    attachments_names: message.attachments_names,
  });

  if (error) throw error;
  console.log('[MessageStore] ✓ User message saved');
}

export async function saveAssistantMessage(
  chatId: string,
  content: string,
  messageId: string
): Promise<void> {
  console.log('[MessageStore] Saving assistant message:', messageId);
  
  const supabase = await createClient();

  const { error } = await supabase.from('messages').insert({
    id: messageId,
    chat_id: chatId,
    content,
    role: 'assistant',
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
  console.log('[MessageStore] ✓ Assistant message saved');
}

export async function createChat(chat: Chat, threadId?: string, vsId?: string): Promise<void> {
  console.log('[MessageStore] Creating new chat:', chat.id);
  
  const supabase = await createClient();

  const { error } = await supabase.from('chats').insert({
    id: chat.id,
    user_id: chat.user_id,
    brand_id: chat.brand_id,
    agent_id: chat.agent_id,
    title: chat.title,
    created_at: chat.created_at,
    updated_at: chat.updated_at,
    thread_id: threadId,
    vs_id: vsId,
  });

  if (error) throw error;
  console.log('[MessageStore] ✓ Chat created');
}

export async function updateChatThread(chatId: string, threadId: string, vsId?: string): Promise<void> {
  console.log('[MessageStore] Updating chat thread:', chatId);
  
  const supabase = await createClient();

  const updateData: any = { thread_id: threadId };
  if (vsId) {
    updateData.vs_id = vsId;
  }

  const { error } = await supabase
    .from('chats')
    .update(updateData)
    .eq('id', chatId);

  if (error) throw error;
  console.log('[MessageStore] ✓ Chat updated');
}
