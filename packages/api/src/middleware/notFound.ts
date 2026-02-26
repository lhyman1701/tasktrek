import { Request, Response } from 'express';

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist'
  });
}
