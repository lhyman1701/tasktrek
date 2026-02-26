import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import { AppError } from './errorHandler.js';

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new AppError(401, 'Missing API token');
    }

    const user = await prisma.user.findUnique({
      where: { apiToken: token },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      throw new AppError(401, 'Invalid API token');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
