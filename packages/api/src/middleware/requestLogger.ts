import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (env.isTest) {
    next();
    return;
  }

  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const message = `${method} ${url} ${statusCode} ${duration}ms`;

    if (logLevel === 'error') {
      console.error(message);
    } else if (logLevel === 'warn') {
      console.warn(message);
    } else if (env.isDev) {
      console.log(message);
    }
  });

  next();
}
