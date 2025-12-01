// app/api/chat/agents/ai-agent.ts
'use server';

import openai from '@/lib/openai-server';
import type { AgentContext } from '@/app/api/chat/types';

export async function executeAIAgent(
  context: AgentContext,
  systemPrompt: string
): Promise<string> {
  console.log('[AI-Agent] Executing AI Agent...');
  
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of context.sortedMessages) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  }

  let finalMessage = context.lastMessage;
  if (context.attachmentDescription) {
    finalMessage = `${finalMessage}\n\n${context.attachmentDescription.description}\n${context.attachmentDescription.Text}`;
  }

  messages.push({
    role: 'user',
    content: finalMessage,
  });

  console.log('[AI-Agent] Calling OpenAI with', messages.length, 'messages');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.3,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content || 'No response generated';
  console.log('[AI-Agent] ✓ Response generated');
  
  return content;
}
