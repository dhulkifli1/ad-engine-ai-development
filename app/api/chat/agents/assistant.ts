// app/api/chat/agents/assistant.ts
'use server';

import { processAttachments } from '@/app/api/chat/services/file-processor';
import { getOrCreateVectorStore, addFilesToVectorStore } from '@/app/api/chat/services/vector-store';
import { createOrUpdateThread, runAssistant } from '@/app/api/chat/services/thread-manager';
import { createChat, updateChatThread, saveUserMessage, saveAssistantMessage } from '@/app/api/chat/services/message-store';
import type { ChatPayload, AssistantResponse } from '@/app/api/chat/types';

export async function executeAssistant(payload: ChatPayload): Promise<AssistantResponse> {
  console.log('[AssistantAgent] Starting execution...');
  
  const { messages, chats, assistant_id } = payload;

  if (!assistant_id) {
    throw new Error('Assistant ID is required');
  }

  let imageUrls: string[] = [];
  let fileIds: string[] = [];
  let fileDetails: Array<{ id: string; name: string; type: string }> = [];

  if (messages.attachments && messages.attachments.length > 0) {
    console.log('[AssistantAgent] Processing', messages.attachments.length, 'attachments');
    const processed = await processAttachments(messages.attachments);
    imageUrls = processed.imageUrls;
    fileIds = processed.fileIds;
    fileDetails = processed.fileDetails;
  }

  console.log('[AssistantAgent] Managing vector store...');
  const vsId = await getOrCreateVectorStore(chats.id, chats.vs_id);

  if (fileIds.length > 0) {
    console.log('[AssistantAgent] Adding', fileIds.length, 'files to vector store');
    await addFilesToVectorStore(vsId, fileIds);
  }

  console.log('[AssistantAgent] Managing thread...');
  const threadId = await createOrUpdateThread(
    chats.thread_id,
    messages.content,
    imageUrls,
    fileIds,
    fileDetails
  );

  console.log('[AssistantAgent] Running assistant:', assistant_id);
  const response = await runAssistant(threadId, assistant_id, vsId);

  console.log('[AssistantAgent] Saving messages...');
  
  if (!chats.thread_id) {
    await createChat(chats, threadId, vsId);
  } else {
    await updateChatThread(chats.id, threadId, vsId);
  }

  await saveUserMessage(messages);

  const assistantMessageId = crypto.randomUUID();
  await saveAssistantMessage(chats.id, response.assistant_response, assistantMessageId);

  console.log('[AssistantAgent] ✓ Execution complete');
  return response;
}
