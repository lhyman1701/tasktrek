const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Get token from localStorage
function getToken(): string | null {
  return localStorage.getItem('taskflow_token');
}

// Get Anthropic API key from localStorage
function getAnthropicKey(): string | null {
  return localStorage.getItem('taskflow_anthropic_key');
}

// Get user's timezone
function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// API request helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  includeAnthropicKey = false
): Promise<T> {
  const token = getToken();
  const anthropicKey = includeAnthropicKey ? getAnthropicKey() : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Timezone': getTimezone(),
    ...options.headers
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (anthropicKey) {
    (headers as Record<string, string>)['X-Anthropic-Key'] = anthropicKey;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// API methods
export const api = {
  // Tasks
  tasks: {
    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return request<Task[]>(`/tasks${query}`);
    },
    get: (id: string) => request<Task>(`/tasks/${id}`),
    create: (data: CreateTaskInput) => request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: UpdateTaskInput) => request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => request<void>(`/tasks/${id}`, {
      method: 'DELETE'
    }),
    complete: (id: string) => request<Task>(`/tasks/${id}/complete`, {
      method: 'POST'
    }),
    reopen: (id: string) => request<Task>(`/tasks/${id}/reopen`, {
      method: 'POST'
    })
  },

  // Projects
  projects: {
    list: () => request<Project[]>('/projects'),
    get: (id: string) => request<Project>(`/projects/${id}`),
    create: (data: CreateProjectInput) => request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: UpdateProjectInput) => request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => request<void>(`/projects/${id}`, {
      method: 'DELETE'
    })
  },

  // Labels
  labels: {
    list: () => request<Label[]>('/labels'),
    create: (data: CreateLabelInput) => request<Label>('/labels', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Smart Lists
  smartLists: {
    get: (type: string, params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return request<SmartListResult>(`/smart-lists/${type}${query}`);
    },
    counts: () => request<SmartListCounts>('/smart-lists/counts')
  },

  // AI
  ai: {
    quickAdd: (text: string) => request<{ task: Task; parsed: ParsedTask }>('/ai/quick-add', {
      method: 'POST',
      body: JSON.stringify({ text })
    }, true),
    parse: (text: string) => request<ParsedTask>('/ai/parse', {
      method: 'POST',
      body: JSON.stringify({ text })
    }, true)
  },

  // Chat
  chat: {
    send: (message: string, history: ChatMessage[]) => request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history })
    }, true),
    conversations: () => request<Conversation[]>('/chat/conversations'),
    getConversation: (id: string) => request<ConversationWithMessages>(`/chat/conversations/${id}`),
    sendPersistent: (message: string, conversationId?: string) =>
      request<PersistentChatResponse>('/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ message, conversationId })
      }, true)
  }
};

// Types
export interface Task {
  id: string;
  content: string;
  description: string | null;
  priority: number;
  isCompleted: boolean;
  completedAt: string | null;
  dueDate: string | null;
  order: number;
  projectId: string | null;
  sectionId: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; color: string } | null;
  labels?: { id: string; name: string; color: string }[];
}

export type TaskPriority = 'p1' | 'p2' | 'p3' | 'p4';

export interface CreateTaskInput {
  content: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  projectId?: string;
  sectionId?: string;
  labelIds?: string[];
}

export interface UpdateTaskInput {
  content?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  projectId?: string | null;
  sectionId?: string | null;
  labelIds?: string[];
}

export interface Project {
  id: string;
  name: string;
  color: string;
  order: number;
  isFavorite: boolean;
  isArchived: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}

export interface CreateProjectInput {
  name: string;
  color?: string;
  parentId?: string;
}

export interface UpdateProjectInput {
  name?: string;
  color?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabelInput {
  name: string;
  color?: string;
}

export interface SmartListResult {
  type: string;
  tasks: Task[];
  total: number;
  hasMore: boolean;
}

export interface SmartListCounts {
  inbox: number;
  today: number;
  upcoming: number;
  overdue: number;
  noDate: number;
  completed: number;
}

export interface ParsedTask {
  content: string;
  dueDate?: string;
  dueTime?: string;
  priority?: 'p1' | 'p2' | 'p3' | 'p4';
  projectName?: string;
  labels?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  actions: ChatAction[];
}

export interface ChatAction {
  tool: string;
  input: Record<string, unknown>;
  result: { success: boolean; data?: unknown; error?: string };
}

export interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

export interface ConversationWithMessages extends Conversation {
  messages: {
    id: string;
    role: string;
    content: string;
    toolCalls: unknown;
    createdAt: string;
  }[];
}

export interface PersistentChatResponse {
  conversationId: string;
  response: string;
  actions: ChatAction[];
}
