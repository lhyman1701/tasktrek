# TASK-026: Build AI Chat Panel

## Status: blocked

## Dependencies

- TASK-020

## Description

Build chat interface for AI task management.

## Implementation

```typescript
// components/ChatPanel.tsx
import { useState, useRef, useEffect } from 'react';
import { useChat, useSendMessage } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

export function ChatPanel() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { data: messages, isLoading } = useChat(conversationId);
  const sendMessage = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    const result = await sendMessage.mutateAsync({
      conversationId,
      message: text
    });
    if (!conversationId) {
      setConversationId(result.conversationId);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">AI Assistant</h2>
        <button
          onClick={() => setConversationId(null)}
          className="text-sm text-primary-600"
        >
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map(msg => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            actions={msg.toolCalls}
          />
        ))}
        {sendMessage.isPending && (
          <ChatMessage role="assistant" isLoading />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={sendMessage.isPending}
      />
    </div>
  );
}

// components/ChatMessage.tsx
export function ChatMessage({ role, content, actions, isLoading }: ChatMessageProps) {
  return (
    <div className={cn(
      'flex',
      role === 'user' ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-2',
        role === 'user'
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800'
      )}>
        {isLoading ? (
          <TypingIndicator />
        ) : (
          <>
            <p className="whitespace-pre-wrap">{content}</p>
            {actions?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {actions.map((action, i) => (
                  <ActionBadge key={i} action={action} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

## Acceptance Criteria

1. [ ] Chat messages display
2. [ ] User/assistant styling differs
3. [ ] Actions shown inline
4. [ ] Auto-scroll to bottom
5. [ ] New chat clears history
6. [ ] Loading indicator
7. [ ] Input disabled while loading
