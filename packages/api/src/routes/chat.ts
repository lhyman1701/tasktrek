import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateBody, validateParams } from '../middleware/validate.js';
import { chat, getUserContext } from '../services/chatService.js';
import { ChatMessage } from '../types/nlp.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { UuidParamSchema } from '@taskflow/shared';

const router = Router();

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Schema for simple chat (no persistence)
const SimpleChatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().default([])
});

// Schema for persistent chat
const PersistentChatSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional()
});

// POST /api/chat - Simple chat (no persistence)
router.post('/',
  validateBody(SimpleChatSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const anthropicApiKey = req.headers['x-anthropic-key'] as string | undefined;
    const timezone = req.headers['x-timezone'] as string || 'UTC';
    const { message, history } = req.body as { message: string; history: ChatMessage[] };

    const context = await getUserContext(userId);
    const response = await chat(context, message, history, anthropicApiKey, timezone);

    res.json(response);
  })
);

// GET /api/chat/conversations - List conversations
router.get('/conversations',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        _count: { select: { messages: true } }
      }
    });

    res.json(conversations);
  })
);

// GET /api/chat/conversations/:id - Get conversation with messages
router.get('/conversations/:id',
  validateParams(UuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, userId },
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
  })
);

// POST /api/chat/messages - Send message with persistence
router.post('/messages',
  validateBody(PersistentChatSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const anthropicApiKey = req.headers['x-anthropic-key'] as string | undefined;
    const timezone = req.headers['x-timezone'] as string || 'UTC';
    const { message, conversationId } = req.body;

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId }
      });
      if (!conversation) {
        throw new AppError(404, 'Conversation not found');
      }
    } else {
      conversation = await prisma.conversation.create({
        data: { userId }
      });
    }

    // Get history from database
    const dbMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' }
    });

    const history: ChatMessage[] = dbMessages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    // Chat with AI
    const context = await getUserContext(userId);
    const { response, actions } = await chat(context, message, history, anthropicApiKey, timezone);

    // Save messages
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: 'user',
          content: message
        },
        {
          conversationId: conversation.id,
          role: 'assistant',
          content: response,
          toolCalls: actions.length ? JSON.parse(JSON.stringify(actions)) : undefined
        }
      ]
    });

    // Update conversation title from first message if not set
    if (!conversation.title) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { title: message.slice(0, 100) }
      });
    } else {
      // Just update the timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() }
      });
    }

    res.json({
      conversationId: conversation.id,
      response,
      actions
    });
  })
);

// DELETE /api/chat/conversations/:id - Delete conversation
router.delete('/conversations/:id',
  validateParams(UuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const deleted = await prisma.conversation.deleteMany({
      where: { id: req.params.id, userId }
    });

    if (deleted.count === 0) {
      throw new AppError(404, 'Conversation not found');
    }

    res.status(204).send();
  })
);

export default router;
