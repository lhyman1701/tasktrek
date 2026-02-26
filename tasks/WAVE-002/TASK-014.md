# TASK-014: Add Conversation Persistence

## Status: blocked

## Dependencies

- TASK-013: Chat Service

## Description

Persist chat conversations in the database for history and context.

## Database Schema Addition

```prisma
model Conversation {
  id        String    @id @default(uuid())
  userId    String
  title     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]

  @@index([userId])
}

model Message {
  id             String   @id @default(uuid())
  conversationId String
  role           String   // 'user' | 'assistant'
  content        String
  toolCalls      Json?    // Store tool calls/results
  createdAt      DateTime @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
}
```

## API Endpoints

```typescript
// routes/chat.ts

// List conversations
router.get('/conversations', async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: { userId: req.user!.id },
    orderBy: { updatedAt: 'desc' },
    take: 50
  });
  res.json(conversations);
});

// Get conversation with messages
router.get('/conversations/:id', async (req, res) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });
  if (!conversation) {
    throw new AppError(404, 'Conversation not found');
  }
  res.json(conversation);
});

// Send message (creates conversation if needed)
router.post('/messages', async (req, res) => {
  const { conversationId, message } = req.body;

  let conversation: Conversation;
  if (conversationId) {
    conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: req.user!.id }
    });
  } else {
    conversation = await prisma.conversation.create({
      data: { userId: req.user!.id }
    });
  }

  // Get history
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' }
  });

  // Chat with AI
  const { response, actions } = await chat(
    req.user!.id,
    message,
    history.map(m => ({ role: m.role, content: m.content }))
  );

  // Save messages
  await prisma.message.createMany({
    data: [
      { conversationId: conversation.id, role: 'user', content: message },
      {
        conversationId: conversation.id,
        role: 'assistant',
        content: response,
        toolCalls: actions.length ? actions : undefined
      }
    ]
  });

  // Update conversation title from first message
  if (!conversation.title) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { title: message.slice(0, 50) }
    });
  }

  res.json({
    conversationId: conversation.id,
    response,
    actions
  });
});

// Delete conversation
router.delete('/conversations/:id', async (req, res) => {
  await prisma.conversation.deleteMany({
    where: {
      id: req.params.id,
      userId: req.user!.id
    }
  });
  res.status(204).end();
});
```

## Acceptance Criteria

1. [ ] Conversations persist across sessions
2. [ ] Message history loaded for context
3. [ ] Tool calls stored with messages
4. [ ] Conversation listing with pagination
5. [ ] Delete conversation removes all messages
6. [ ] Auto-title from first message
