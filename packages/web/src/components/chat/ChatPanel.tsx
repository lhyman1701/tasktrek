import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Send, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { api, ChatMessage, ChatAction } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export function ChatPanel() {
  const { toggleChat } = useUIStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [actions, setActions] = useState<ChatAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = useMutation({
    mutationFn: ({ message, history }: { message: string; history: ChatMessage[] }) =>
      api.chat.send(message, history),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response }
      ]);
      setActions(data.actions);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || chat.isPending) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    chat.mutate({ message: input, history: messages });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>
        <button
          onClick={toggleChat}
          className="rounded-lg p-1 hover:bg-surface-100 dark:hover:bg-surface-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-surface-500 py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <p className="font-medium">Ask me anything!</p>
            <p className="text-sm mt-2">
              I can help you manage tasks, create projects, and more.
            </p>
            <div className="mt-4 space-y-2 text-sm text-left max-w-xs mx-auto">
              <p className="text-surface-400">Try asking:</p>
              <button
                onClick={() => setInput("What tasks do I have today?")}
                className="block w-full text-left px-3 py-2 rounded-lg bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700"
              >
                "What tasks do I have today?"
              </button>
              <button
                onClick={() => setInput("Create a task to review the proposal tomorrow at 2pm")}
                className="block w-full text-left px-3 py-2 rounded-lg bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700"
              >
                "Create a task to review the proposal tomorrow"
              </button>
              <button
                onClick={() => setInput("Show me my overdue tasks")}
                className="block w-full text-left px-3 py-2 rounded-lg bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700"
              >
                "Show me my overdue tasks"
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-4 py-2',
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-100 dark:bg-surface-800'
              )}
            >
              {message.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="space-y-2">
            {actions.map((action, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2 text-xs px-3 py-2 rounded-lg',
                  action.result.success
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                )}
              >
                {action.result.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="font-medium">{action.tool}</span>
                {action.result.error && <span>: {action.result.error}</span>}
              </div>
            ))}
          </div>
        )}

        {chat.isPending && (
          <div className="flex justify-start">
            <div className="bg-surface-100 dark:bg-surface-800 rounded-lg px-4 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="input flex-1 min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            disabled={chat.isPending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chat.isPending}
            className="btn-primary px-3"
          >
            {chat.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
