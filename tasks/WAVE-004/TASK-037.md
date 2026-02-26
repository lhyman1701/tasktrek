# TASK-037: Build AI Chat Tab

## Status: blocked

## Dependencies

- TASK-032

## Description

Build AI chat interface for mobile.

## Implementation

```typescript
// app/(tabs)/chat.tsx
import { useState, useRef, useEffect } from 'react';
import {
  View, FlatList, TextInput, Pressable, KeyboardAvoidingView,
  Platform, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat, useSendMessage } from '@taskflow/shared';
import { ChatBubble } from '@/components/ChatBubble';

export default function ChatScreen() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const { data: messages } = useChat(conversationId);
  const sendMessage = useSendMessage();
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const text = input;
    setInput('');

    const result = await sendMessage.mutateAsync({
      conversationId,
      message: text
    });

    if (!conversationId) {
      setConversationId(result.conversationId);
    }
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble
            role={item.role}
            content={item.content}
            actions={item.toolCalls}
          />
        )}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-ellipses" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>
              Ask me to help manage your tasks
            </Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything..."
          multiline
          maxLength={500}
        />
        <Pressable
          onPress={handleSend}
          disabled={!input.trim() || sendMessage.isPending}
          style={[
            styles.sendButton,
            (!input.trim() || sendMessage.isPending) && styles.disabled
          ]}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// components/ChatBubble.tsx
export function ChatBubble({ role, content, actions }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[
      styles.bubble,
      isUser ? styles.userBubble : styles.assistantBubble
    ]}>
      <Text style={[
        styles.text,
        isUser && styles.userText
      ]}>
        {content}
      </Text>

      {actions?.length > 0 && (
        <View style={styles.actions}>
          {actions.map((action, i) => (
            <View key={i} style={styles.actionBadge}>
              <Text style={styles.actionText}>
                {action.tool}: {JSON.stringify(action.result).slice(0, 50)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  messageList: {
    padding: 16,
    flexGrow: 1
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100
  },
  emptyText: {
    marginTop: 16,
    color: '#9ca3af'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end'
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  disabled: {
    opacity: 0.5
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0ea5e9'
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6'
  },
  text: {
    fontSize: 16
  },
  userText: {
    color: '#fff'
  },
  actions: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8
  },
  actionBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    padding: 4,
    marginVertical: 2
  },
  actionText: {
    fontSize: 12
  }
});
```

## Acceptance Criteria

1. [ ] Chat messages render
2. [ ] Send message works
3. [ ] Auto-scroll to bottom
4. [ ] Actions shown in bubbles
5. [ ] Empty state shown
6. [ ] Keyboard avoids input
