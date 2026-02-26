// TaskFlow API Entry Point

// Construct DATABASE_URL from individual components if not set
// This must be done before importing Prisma
if (!process.env.DATABASE_URL && process.env.DATABASE_HOST) {
  const host = process.env.DATABASE_HOST;
  const port = process.env.DATABASE_PORT || '5432';
  const name = process.env.DATABASE_NAME || 'taskflow';
  const user = process.env.DATABASE_USERNAME;
  const pass = process.env.DATABASE_PASSWORD;
  process.env.DATABASE_URL = `postgresql://${user}:${pass}@${host}:${port}/${name}`;
}

import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './db/client.js';

async function main() {
  const app = createApp();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  app.listen(env.port, () => {
    console.log(`TaskFlow API running on http://localhost:${env.port}`);
    console.log(`Environment: ${env.nodeEnv}`);
    console.log(`Health check: http://localhost:${env.port}/api/health`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
