// app/api/chat/services/thread-manager.ts
'use server';

import openai from '@/lib/openai-server';
import { getFileTools } from '@/app/api/chat/utils/file-validator';
import type { AssistantResponse } from '@/app/api/chat/types';

export async function createOrUpdateThread(
  threadId: string | undefined,
  message: string,
  imageUrls: string[],
  fileIds: string[],
  fileDetails: Array<{ id: string; name: string; type: string }>
): Promise<string> {
  console.log('[ThreadManager] createOrUpdateThread - hasThread:', !!threadId);
  
  const content = buildMessageContent(message, imageUrls, fileDetails);
  const attachments = buildAttachments(fileIds, fileDetails);

  try {
    if (threadId) {
      console.log('[ThreadManager] Adding message to thread:', threadId);
      
      if (openai.beta?.threads?.messages) {
        await openai.beta.threads.messages.create(threadId, {
          role: 'user',
          content,
          attachments,
        });
      } else if ((openai as any).threads?.messages) {
        await (openai as any).threads.messages.create(threadId, {
          role: 'user',
          content,
          attachments,
        });
      } else {
        throw new Error('Threads API not available on OpenAI client');
      }
      
      console.log('[ThreadManager] ✓ Message added to thread');
      return threadId;
    }

    console.log('[ThreadManager] Creating new thread');
    
    let thread;
    if (openai.beta?.threads) {
      thread = await openai.beta.threads.create({
        messages: [{ role: 'user', content, attachments }],
      });
    } else if ((openai as any).threads) {
      thread = await (openai as any).threads.create({
        messages: [{ role: 'user', content, attachments }],
      });
    } else {
      throw new Error('Threads API not available on OpenAI client');
    }
    
    console.log('[ThreadManager] ✓ Created thread:', thread.id);
    return thread.id;
  } catch (error) {
    console.error('[ThreadManager] Error in createOrUpdateThread:', error);
    throw error;
  }
}

export async function runAssistantWithStreaming(
  threadId: string,
  assistantId: string,
  vectorStoreId: string,
  onChunk: (chunk: string) => void
): Promise<AssistantResponse> {
  console.log(
    "[ThreadManager] Running assistant with streaming:",
    assistantId,
    "on thread:",
    threadId
  );

  try {
    // Create the run with streaming enabled
    const stream = await openai.beta.threads.runs.stream(threadId, {
      assistant_id: assistantId,
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStoreId],
        },
      },
    });

    let fullResponse = "";
    let messageId = "";
    let runId = "";

    // Handle streaming events
    for await (const event of stream) {
      // Log event type for debugging
      console.log("[ThreadManager] Stream event:", event.event);

      // Handle different event types
      if (event.event === "thread.run.created") {
        runId = event.data.id;
        console.log("[ThreadManager] Run created:", runId);
      }

      // When text is being generated
      if (event.event === "thread.message.delta") {
        const delta = event.data.delta;

        if (delta.content && delta.content.length > 0) {
          for (const content of delta.content) {
            if (content.type === "text" && content.text?.value) {
              const chunk = content.text.value;
              fullResponse += chunk;
              onChunk(chunk); // Send chunk immediately
            }
          }
        }
      }

      // When message is completed
      if (event.event === "thread.message.completed") {
        messageId = event.data.id;
        console.log("[ThreadManager] Message completed:", messageId);
      }

      // Handle errors
      if (event.event === "thread.run.failed") {
        console.error("[ThreadManager] Run failed:", event.data);
        throw new Error(
          `Run failed: ${event.data.last_error?.message || "Unknown error"}`
        );
      }

      if (event.event === "thread.run.cancelled") {
        console.error("[ThreadManager] Run cancelled");
        throw new Error("Run was cancelled");
      }

      if (event.event === "thread.run.expired") {
        console.error("[ThreadManager] Run expired");
        throw new Error("Run expired");
      }
    }

    console.log("[ThreadManager] ✓ Assistant streaming completed");

    return {
      success: true,
      thread_id: threadId,
      assistant_response: fullResponse,
      message_id: messageId,
      run_id: runId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[ThreadManager] Error in runAssistantWithStreaming:", error);
    throw error;
  }
}

export async function runAssistant(
  threadId: string,
  assistantId: string,
  vectorStoreId: string
): Promise<AssistantResponse> {
  console.log('[ThreadManager] Running assistant:', assistantId, 'on thread:', threadId);

  try {
    let run;
    if (openai.beta?.threads?.runs) {
      run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId],
          },
        },
      });
    } else if ((openai as any).threads?.runs) {
      run = await (openai as any).threads.runs.create(threadId, {
        assistant_id: assistantId,
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId],
          },
        },
      });
    } else {
      throw new Error('Threads Runs API not available on OpenAI client');
    }

    console.log('[ThreadManager] Run started:', run.id);

    const completedRun = await pollRunStatus(threadId, run.id);

    if (completedRun.status !== 'completed') {
      throw new Error(`Run failed with status: ${completedRun.status}`);
    }

    let messages;
    if (openai.beta?.threads?.messages) {
      messages = await openai.beta.threads.messages.list(threadId, {
        limit: 1,
        order: 'desc',
      });
    } else if ((openai as any).threads?.messages) {
      messages = await (openai as any).threads.messages.list(threadId, {
        limit: 1,
        order: 'desc',
      });
    } else {
      throw new Error('Threads Messages API not available on OpenAI client');
    }

    const msg = messages.data[0];
    const textContent = msg.content.find(c => c.type === 'text');
    const text = textContent && textContent.type === 'text' ? textContent.text.value : '';

    console.log('[ThreadManager] ✓ Assistant responded');

    return {
      success: true,
      thread_id: threadId,
      assistant_response: text,
      message_id: msg.id,
      run_id: run.id,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[ThreadManager] Error in runAssistant:', error);
    throw error;
  }
}

async function pollRunStatus(threadId: string, runId: string) {
  console.log('[ThreadManager] pollRunStatus ENTRY - threadId:', threadId, 'runId:', runId);
  
  // ✅ WORKAROUND: Use direct fetch instead of SDK method
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found');
  }
  
  for (let i = 0; i < 40; i++) {
    console.log('[ThreadManager] Poll attempt', i + 1);
    
    try {
      // Direct API call using fetch
      const url = `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`;
      console.log('[ThreadManager] Fetching:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ThreadManager] API error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }
      
      const run = await response.json();
      console.log('[ThreadManager] ✓ Successfully retrieved run status:', run.status);
      
      if (['completed', 'failed', 'cancelled', 'expired'].includes(run.status)) {
        console.log('[ThreadManager] ✓ Run finished with status:', run.status);
        return run;
      }
      
      console.log('[ThreadManager] Run still in progress, waiting...');
      await new Promise(r => setTimeout(r, 1500));
      
    } catch (error) {
      console.error('[ThreadManager] Error polling run status (attempt', i + 1, '):', error);
      throw error;
    }
  }
  
  throw new Error('Run timed out after 60 seconds');
}

function buildMessageContent(
  message: string,
  imageUrls: string[],
  fileDetails: Array<{ name: string; type: string }>
) {
  const content: any[] = [];
  const trimmed = message.trim();

  if (trimmed) {
    content.push({ type: 'text', text: trimmed });
  } else if (imageUrls.length + fileDetails.length > 0) {
    const total = imageUrls.length + fileDetails.length;
    content.push({
      type: 'text',
      text: total === 1 ? '[Attachment uploaded]' : `[${total} attachments uploaded]`,
    });
  }

  imageUrls.forEach(url => {
    content.push({ type: 'image_url', image_url: { url } });
  });

  return content;
}

function buildAttachments(
  fileIds: string[],
  fileDetails: Array<{ id: string; name: string; type: string }>
) {
  return fileIds.map((id, i) => ({
    file_id: id,
    tools: getFileTools(fileDetails[i]?.name || 'unknown'),
  }));
}
