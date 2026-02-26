import { ParsedTask, ParseContext } from '../types/nlp.js';
import { taskParserPrompt } from '../prompts/taskParser.js';
import { AppError } from '../middleware/errorHandler.js';
import { getAnthropicClient } from './anthropicClient.js';
import { toZonedTime, format } from 'date-fns-tz';

export async function parseTaskText(
  text: string,
  context?: ParseContext,
  anthropicApiKey?: string,
  timezone: string = 'UTC'
): Promise<ParsedTask> {
  try {
    // Get current date/time in user's timezone
    const now = new Date();
    const zonedNow = toZonedTime(now, timezone);
    const currentDateInTz = format(zonedNow, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: timezone });

    const anthropic = getAnthropicClient(anthropicApiKey);
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: taskParserPrompt,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            input: text,
            availableProjects: context?.projects || [],
            availableLabels: context?.labels || [],
            currentDate: currentDateInTz,
            timezone: timezone
          })
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new AppError(500, 'Unexpected response type from AI');
    }

    // Clean up response - remove any markdown formatting
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const parsed = JSON.parse(jsonText) as ParsedTask;

    // Validate required field
    if (!parsed.content || typeof parsed.content !== 'string') {
      throw new AppError(500, 'AI response missing required content field');
    }

    // Normalize priority
    if (parsed.priority && !['p1', 'p2', 'p3', 'p4'].includes(parsed.priority)) {
      parsed.priority = 'p4';
    }

    return parsed;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw new AppError(500, 'Failed to parse AI response as JSON');
    }
    throw new AppError(500, `NLP parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function combineDateAndTime(
  dueDate?: string,
  dueTime?: string
): string | null {
  if (!dueDate) {
    return null;
  }

  if (dueTime) {
    // Combine date and time into ISO string
    return `${dueDate}T${dueTime}:00.000Z`;
  }

  // Date only - set to noon UTC to prevent timezone shifts from changing the date
  return `${dueDate}T12:00:00.000Z`;
}
