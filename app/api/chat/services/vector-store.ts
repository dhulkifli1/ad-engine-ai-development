// app/api/chat/services/vector-store.ts
'use server';

import openai from '@/lib/openai-server';
import { createClient } from '@/lib/supabase/server';

export async function getOrCreateVectorStore(chatId: string, vsId?: string): Promise<string> {
  console.log('[VectorStore] getOrCreateVectorStore - chatId:', chatId, 'vsId:', vsId);

  if (!vsId) {
    console.log('[VectorStore] No vsId provided → creating new');
    return await createVectorStore(chatId);
  }

  const isValid = await validateVectorStore(vsId);
  console.log('[VectorStore] Validation result:', isValid);

  if (!isValid) {
    console.log('[VectorStore] Invalid/expired → recreating');
    const newVsId = await createVectorStore(chatId);
    await updateChatVectorStore(chatId, newVsId);
    return newVsId;
  }

  console.log('[VectorStore] Using existing vsId:', vsId);
  return vsId;
}

async function validateVectorStore(vsId: string): Promise<boolean> {
  try {
    let store;
    if (openai.beta?.vectorStores) {
      store = await openai.beta.vectorStores.retrieve(vsId);
    } else if ((openai as any).vectorStores) {
      store = await (openai as any).vectorStores.retrieve(vsId);
    } else {
      console.error('[VectorStore] VectorStores API not available on OpenAI client');
      return false;
    }
    
    const valid = store.status !== 'expired' && store.object === 'vector_store';
    console.log('[VectorStore] Validation - status:', store.status, 'valid:', valid);
    return valid;
  } catch (err) {
    console.error('[VectorStore] Validation error:', err);
    return false;
  }
}

async function createVectorStore(chatId: string): Promise<string> {
  console.log('[VectorStore] Creating new vector store for chat:', chatId);
  
  let store;
  if (openai.beta?.vectorStores) {
    store = await openai.beta.vectorStores.create({
      name: `chat-${chatId}`,
      expires_after: { anchor: 'last_active_at', days: 365 },
    });
  } else if ((openai as any).vectorStores) {
    store = await (openai as any).vectorStores.create({
      name: `chat-${chatId}`,
      expires_after: { anchor: 'last_active_at', days: 365 },
    });
  } else {
    throw new Error('VectorStores API not available on OpenAI client');
  }

  console.log('[VectorStore] ✓ Created:', store.id);
  return store.id;
}

export async function addFilesToVectorStore(vsId: string, fileIds: string[]): Promise<void> {
  if (fileIds.length === 0) {
    console.log('[VectorStore] No files to add');
    return;
  }

  console.log('[VectorStore] Adding', fileIds.length, 'files to', vsId);
  
  if (openai.beta?.vectorStores?.fileBatches) {
    await openai.beta.vectorStores.fileBatches.create(vsId, {
      file_ids: fileIds,
    });
  } else if ((openai as any).vectorStores?.fileBatches) {
    await (openai as any).vectorStores.fileBatches.create(vsId, {
      file_ids: fileIds,
    });
  } else {
    throw new Error('VectorStores FileBatches API not available on OpenAI client');
  }

  console.log('[VectorStore] ✓ Files added');
}

async function updateChatVectorStore(chatId: string, vsId: string): Promise<void> {
  const supabase = await createClient();
  console.log('[VectorStore] Updating DB with new vsId:', vsId);
  
  await supabase
    .from('chats')
    .update({ vs_id: vsId })
    .eq('id', chatId);
}
