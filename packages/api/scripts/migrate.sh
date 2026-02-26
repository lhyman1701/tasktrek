#!/bin/bash
# Construct DATABASE_URL from individual components
export DATABASE_URL="postgresql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT:-5432}/${DATABASE_NAME:-taskflow}"

echo "DATABASE_URL constructed (host: ${DATABASE_HOST})"

echo "Pushing schema to database..."
npx prisma db push --schema=prisma/schema.prisma --accept-data-loss

echo "Running seed..."
node prisma/seed.js
