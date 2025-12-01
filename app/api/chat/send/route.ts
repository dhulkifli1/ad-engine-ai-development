// app/api/chat/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeAssistant } from '@/app/api/chat/agents/assistant';
import { executeAIAgent } from '@/app/api/chat/agents/ai-agent';
import { getChatHistory, createChat, saveUserMessage, saveAssistantMessage } from '@/app/api/chat/services/message-store';
import { analyzeImage, extractTextFromPDF } from '@/app/api/chat/services/file-processor';

export async function POST(req: NextRequest) {
  console.log('[CHAT-API] ========== NEW REQUEST ==========');
  
  try {
    console.log('[CHAT-API] Step 1: Parsing request body...');
    const payload = await req.json();
    console.log('[CHAT-API] ✓ Payload parsed');

    console.log('[CHAT-API] Step 2: Validating payload...');
    if (!payload.messages || !payload.chats) {
      console.error('[CHAT-API] ✗ Invalid payload structure');
      return NextResponse.json(
        { error: 'Invalid payload: messages and chats are required' },
        { status: 400 }
      );
    }
    console.log('[CHAT-API] ✓ Payload valid');

    const useAssistant = !!payload.assistant_id;
    console.log('[CHAT-API] Step 3: Agent type:', useAssistant ? 'Assistant API' : 'AI Agent');

    if (useAssistant) {
      console.log('[CHAT-API] Executing Assistant Agent...');
      
      try {
        const response = await executeAssistant(payload);
        console.log('[CHAT-API] ✓ Assistant execution complete');

        return NextResponse.json({
          status: 'Success',
          output: response.assistant_response,
          thread_id: response.thread_id,
          message_id: response.message_id,
        });
      } catch (error) {
        console.error('[CHAT-API] ✗ Assistant execution failed:', error);
        return NextResponse.json(
          { 
            error: 'Assistant execution failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    } else {
      console.log('[CHAT-API] Executing AI Agent...');
      
      try {
        console.log('[CHAT-API] Fetching chat history...');
        const chatHistory = await getChatHistory(payload.chats.id);
        console.log('[CHAT-API] ✓ Chat history fetched:', chatHistory.length, 'messages');

        const context: any = {
          sortedMessages: chatHistory,
          lastMessage: payload.messages.content,
        };

        if (payload.messages.attachments && payload.messages.attachments.length > 0) {
          console.log('[CHAT-API] Processing attachments...');
          const firstAttachment = payload.messages.attachments[0];
          
          if (firstAttachment.toLowerCase().endsWith('.pdf')) {
            console.log('[CHAT-API] Extracting PDF text...');
            const pdfText = await extractTextFromPDF(firstAttachment);
            context.attachmentDescription = {
              description: 'This is the text pulled from the PDF the user is referring to',
              Text: pdfText,
            };
          } else if (/\.(png|jpg|jpeg|gif|webp)$/i.test(firstAttachment)) {
            console.log('[CHAT-API] Analyzing image...');
            const imageText = await analyzeImage(firstAttachment);
            context.attachmentDescription = {
              description: 'This is the text pulled from the image the user is referring to',
              Text: imageText,
            };
          }
          console.log('[CHAT-API] ✓ Attachments processed');
        }

        const systemPrompt = getDefaultSystemPrompt();
        console.log('[CHAT-API] Executing AI agent...');
        const response = await executeAIAgent(context, systemPrompt);
        console.log('[CHAT-API] ✓ AI agent execution complete');

        const isNewChat = chatHistory.length === 0;
        
        if (isNewChat) {
          console.log('[CHAT-API] Creating new chat...');
          await createChat(payload.chats);
        }

        console.log('[CHAT-API] Saving user message...');
        await saveUserMessage(payload.messages);

        const assistantMessageId = crypto.randomUUID();
        console.log('[CHAT-API] Saving assistant message...');
        await saveAssistantMessage(
          payload.chats.id,
          response,
          assistantMessageId
        );

        console.log('[CHAT-API] ✓ All messages saved');

        return NextResponse.json({
          status: 'Success',
          output: response,
        });
      } catch (error) {
        console.error('[CHAT-API] ✗ AI Agent execution failed:', error);
        return NextResponse.json(
          { 
            error: 'AI Agent execution failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('[CHAT-API] ✗ Top-level error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function getDefaultSystemPrompt(): string {
  return `# Overview  
You are an internal **PaidAgency** support bot that delivers accurate, context-driven answers **strictly about paid advertising**.

# Instructions  
1. Answer questions about paid advertising
2. Be concise and actionable
3. Use markdown formatting

If the question is not about paid advertising, respond: "I'm built for paid ads only—can't help with that."`;
}
