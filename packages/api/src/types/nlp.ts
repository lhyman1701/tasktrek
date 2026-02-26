import { TaskPriority } from '@taskflow/shared';

export interface ParsedTask {
  content: string;
  dueDate?: string;
  dueTime?: string;
  priority?: TaskPriority;
  project?: string;
  labels?: string[];
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface ParseContext {
  projects: string[];
  labels: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  userId: string;
  conversationId?: string;
  projects: Array<{ id: string; name: string }>;
  labels: Array<{ id: string; name: string }>;
}
