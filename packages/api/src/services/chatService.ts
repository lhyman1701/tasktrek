import Anthropic from '@anthropic-ai/sdk';
import { MessageParam, ContentBlock, ToolUseBlock, ToolResultBlockParam, Tool } from '@anthropic-ai/sdk/resources/messages';
import { allTools, executeToolCall, ToolResult } from '../tools/index.js';
import { ChatContext, ChatMessage } from '../types/nlp.js';
import { prisma } from '../db/client.js';
import { getAnthropicClient } from './anthropicClient.js';
import { toZonedTime, format } from 'date-fns-tz';

// Streaming event types
export interface StreamEvent {
  type: 'text' | 'tool_start' | 'tool_end' | 'done' | 'error';
  text?: string;
  tool?: string;
  input?: Record<string, unknown>;
  result?: ToolResult;
  error?: string;
  actions?: ChatAction[];
}

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

IMPORTANT - Task Operations:
- When listing tasks, ALWAYS include the task ID in parentheses, e.g. "Buy groceries (id: abc-123)"
- When user refers to an EXISTING task (e.g. "make X due monday", "change X to...", "update X"), ALWAYS search_tasks first to find it, then use update_task
- Only use create_task when user explicitly wants a NEW task (e.g. "create a task", "add a task", "new task")
- If user says "make [task name] due [date]" - this means UPDATE the existing task, not create new
- Never guess task IDs - always search first

Priority levels:
- p1 = urgent/critical
- p2 = high/important
- p3 = medium
- p4 = normal/low

Current context will include the user's existing projects and labels.`;

// Build date context with day of week and calculated dates
function buildDateContext(timezone: string): string {
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  const currentDate = format(zonedNow, 'yyyy-MM-dd', { timeZone: timezone });
  const dayOfWeek = format(zonedNow, 'EEEE', { timeZone: timezone });

  // Calculate upcoming dates
  const tomorrow = new Date(zonedNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = format(tomorrow, 'yyyy-MM-dd');
  const tomorrowDay = format(tomorrow, 'EEEE');

  // Find next Monday (if today is Monday, next Monday is 7 days away)
  const dayNum = zonedNow.getDay(); // 0=Sun, 1=Mon, ...
  const daysUntilMonday = dayNum === 1 ? 7 : (8 - dayNum) % 7;
  const nextMonday = new Date(zonedNow);
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);

  // Calculate all weekdays for the upcoming week
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(zonedNow);
    d.setDate(d.getDate() + i + 1);
    weekDates.push(`${format(d, 'EEEE')}: ${format(d, 'yyyy-MM-dd')}`);
  }

  return `Today: ${currentDate} (${dayOfWeek})
Tomorrow: ${tomorrowDate} (${tomorrowDay})
Upcoming week:
${weekDates.join('\n')}`;
}

export interface ChatAction {
  tool: string;
  input: Record<string, unknown>;
  result: ToolResult;
}

export interface ChatResponse {
  response: string;
  actions: ChatAction[];
}

// Prepare tools with cache control on last tool
function getToolsWithCaching(): Tool[] {
  if (allTools.length === 0) return [];

  return allTools.map((tool, index) => {
    if (index === allTools.length - 1) {
      return { ...tool, cache_control: { type: 'ephemeral' as const } };
    }
    return tool;
  });
}

export async function chat(
  context: ChatContext,
  message: string,
  history: ChatMessage[],
  anthropicApiKey?: string,
  timezone: string = 'UTC'
): Promise<ChatResponse> {
  const anthropic = getAnthropicClient(anthropicApiKey);

  // Build context about user's projects, labels, and dates
  const dateContext = buildDateContext(timezone);
  const contextInfo = `
User's projects: ${context.projects.map(p => `${p.name} (id: ${p.id})`).join(', ') || 'none'}
User's labels: ${context.labels.map(l => `${l.name} (id: ${l.id})`).join(', ') || 'none'}
User's timezone: ${timezone}

${dateContext}
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

  // System prompt with caching
  const systemWithCaching = [
    {
      type: 'text' as const,
      text: SYSTEM_PROMPT + '\n\n' + contextInfo,
      cache_control: { type: 'ephemeral' as const }
    }
  ];

  // Tools with caching on last one
  const toolsWithCaching = getToolsWithCaching();

  // Initial API call with prompt caching
  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemWithCaching,
    tools: toolsWithCaching,
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

    // Continue the conversation with caching
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemWithCaching,
      tools: toolsWithCaching,
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

// Streaming chat function with prompt caching
export async function* streamChat(
  context: ChatContext,
  message: string,
  history: ChatMessage[],
  anthropicApiKey?: string,
  timezone: string = 'UTC'
): AsyncGenerator<StreamEvent> {
  const anthropic = getAnthropicClient(anthropicApiKey);

  // Build context about user's projects, labels, and dates
  const dateContext = buildDateContext(timezone);
  const contextInfo = `
User's projects: ${context.projects.map(p => `${p.name} (id: ${p.id})`).join(', ') || 'none'}
User's labels: ${context.labels.map(l => `${l.name} (id: ${l.id})`).join(', ') || 'none'}
User's timezone: ${timezone}

${dateContext}
`;

  // System prompt with caching
  const systemWithCaching = [
    {
      type: 'text' as const,
      text: SYSTEM_PROMPT + '\n\n' + contextInfo,
      cache_control: { type: 'ephemeral' as const }
    }
  ];

  // Tools with caching on last one
  const toolsWithCaching = getToolsWithCaching();

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

  try {
    let continueLoop = true;

    while (continueLoop) {
      // Create stream with caching enabled
      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemWithCaching,
        tools: toolsWithCaching,
        messages
      });

      // Process stream events - yield text as it arrives
      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            yield { type: 'tool_start', tool: event.content_block.name };
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            yield { type: 'text', text: event.delta.text };
          }
        }
      }

      // Get final message to check stop reason and get full content blocks
      const finalMessage = await stream.finalMessage();

      // Extract tool uses from final message
      const toolUseBlocks = finalMessage.content.filter(
        (block): block is ToolUseBlock => block.type === 'tool_use'
      );

      if (finalMessage.stop_reason === 'tool_use' && toolUseBlocks.length > 0) {
        // Execute tool calls sequentially so we can yield events
        const toolResults: ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
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

          yield {
            type: 'tool_end',
            tool: toolUse.name,
            input: toolUse.input as Record<string, unknown>,
            result
          };

          toolResults.push({
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: JSON.stringify(result)
          });
        }

        // Add assistant response and tool results to messages
        messages.push({
          role: 'assistant',
          content: finalMessage.content
        });
        messages.push({
          role: 'user',
          content: toolResults
        });

        // Continue the loop to get more responses
      } else {
        // No more tool calls, we're done
        continueLoop = false;
      }
    }

    yield { type: 'done', actions };
  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
