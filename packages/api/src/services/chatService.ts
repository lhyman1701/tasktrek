import Anthropic from '@anthropic-ai/sdk';
import { MessageParam, ContentBlock, ToolUseBlock, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import { allTools, executeToolCall, ToolResult } from '../tools/index.js';
import { ChatContext, ChatMessage } from '../types/nlp.js';
import { prisma } from '../db/client.js';
import { getAnthropicClient } from './anthropicClient.js';
import { toZonedTime, format } from 'date-fns-tz';

const SYSTEM_PROMPT = `You are TaskFlow, an AI assistant for personal task management.

You can help users:
- Create, update, complete, and delete tasks
- List tasks with various filters (today, upcoming, overdue, etc.)
- Manage projects and labels
- Search through their tasks

Be concise and helpful. When you perform actions:
- Confirm what was done
- Format task lists clearly with due dates and priorities
- Use the user's project and label names when available

Priority levels:
- p1 = urgent/critical
- p2 = high/important
- p3 = medium
- p4 = normal/low

Current context will include the user's existing projects and labels.`;

export interface ChatAction {
  tool: string;
  input: Record<string, unknown>;
  result: ToolResult;
}

export interface ChatResponse {
  response: string;
  actions: ChatAction[];
}

export async function chat(
  context: ChatContext,
  message: string,
  history: ChatMessage[],
  anthropicApiKey?: string,
  timezone: string = 'UTC'
): Promise<ChatResponse> {
  const anthropic = getAnthropicClient(anthropicApiKey);

  // Get current date in user's timezone
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  const currentDate = format(zonedNow, 'yyyy-MM-dd', { timeZone: timezone });

  // Build context about user's projects and labels
  const contextInfo = `
User's projects: ${context.projects.map(p => `${p.name} (id: ${p.id})`).join(', ') || 'none'}
User's labels: ${context.labels.map(l => `${l.name} (id: ${l.id})`).join(', ') || 'none'}
Current date: ${currentDate}
User's timezone: ${timezone}
`;

  // Convert history to Anthropic message format
  const messages: MessageParam[] = history.map(m => ({
    role: m.role,
    content: m.content
  }));

  // Add current message
  messages.push({
    role: 'user',
    content: message
  });

  const actions: ChatAction[] = [];

  // Initial API call
  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT + '\n\n' + contextInfo,
    tools: allTools,
    messages
  });

  // Process tool calls in a loop
  while (response.stop_reason === 'tool_use') {
    const toolUses = response.content.filter(
      (c): c is ToolUseBlock => c.type === 'tool_use'
    );

    // Execute all tool calls
    const toolResults: ToolResultBlockParam[] = await Promise.all(
      toolUses.map(async (toolUse) => {
        const result = await executeToolCall(
          context.userId,
          toolUse.name,
          toolUse.input as Record<string, unknown>
        );

        actions.push({
          tool: toolUse.name,
          input: toolUse.input as Record<string, unknown>,
          result
        });

        return {
          type: 'tool_result' as const,
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        };
      })
    );

    // Add assistant response and tool results to messages
    messages.push({
      role: 'assistant',
      content: response.content
    });
    messages.push({
      role: 'user',
      content: toolResults
    });

    // Continue the conversation
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + '\n\n' + contextInfo,
      tools: allTools,
      messages
    });
  }

  // Extract text response
  const textContent = response.content.find(
    (c): c is Anthropic.TextBlock => c.type === 'text'
  );

  return {
    response: textContent?.text || 'I completed your request.',
    actions
  };
}

// Get user context (projects and labels)
export async function getUserContext(userId: string): Promise<ChatContext> {
  const [projects, labels] = await Promise.all([
    prisma.project.findMany({
      where: { userId, isArchived: false },
      select: { id: true, name: true }
    }),
    prisma.label.findMany({
      where: { userId },
      select: { id: true, name: true }
    })
  ]);

  return {
    userId,
    projects,
    labels
  };
}
