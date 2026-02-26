# TASK-008: Set Up Docker Compose for Local Dev

## Status: blocked

## Dependencies

- TASK-004: Build Express App Foundation

## Description

Create Docker Compose configuration for local development with PostgreSQL and optional services.

## Files to Create

```
tasktrek/
├── docker-compose.yml
├── docker-compose.override.yml    # Local overrides
├── .env.example
└── packages/api/
    └── .env.example
```

## Docker Compose Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: taskflow-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-taskflow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-taskflow_dev}
      POSTGRES_DB: ${POSTGRES_DB:-taskflow}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-taskflow}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: taskflow-redis
    restart: unless-stopped
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### docker-compose.override.yml

```yaml
# Local development overrides
version: '3.8'

services:
  postgres:
    ports:
      - "5432:5432"

  # Adminer for DB management (dev only)
  adminer:
    image: adminer:latest
    container_name: taskflow-adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      - postgres
```

### Init Script (scripts/init-db.sql)

```sql
-- Create test user for development
-- This runs only on first database initialization

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Application schema is managed by Prisma migrations
```

### Root .env.example

```bash
# Database
POSTGRES_USER=taskflow
POSTGRES_PASSWORD=taskflow_dev
POSTGRES_DB=taskflow
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379
```

### API .env.example

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://taskflow:taskflow_dev@localhost:5432/taskflow

# Redis (for future rate limiting/caching)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

## NPM Scripts

Add to root package.json:

```json
{
  "scripts": {
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:logs": "docker compose logs -f",
    "docker:reset": "docker compose down -v && docker compose up -d",
    "db:migrate": "npm run migrate --workspace=packages/api",
    "db:seed": "npm run seed --workspace=packages/api",
    "db:studio": "npm run studio --workspace=packages/api"
  }
}
```

## Acceptance Criteria

1. [ ] `docker compose up -d` starts PostgreSQL
2. [ ] PostgreSQL accessible on localhost:5432
3. [ ] Database persists across restarts
4. [ ] Health checks work
5. [ ] `.env.example` files documented
6. [ ] Reset script clears all data
7. [ ] Adminer available for DB inspection (dev only)

## Verification

```bash
# Start services
npm run docker:up

# Check services running
docker compose ps

# Check PostgreSQL connection
docker compose exec postgres pg_isready

# Run migrations
npm run db:migrate

# View logs
npm run docker:logs

# Reset database
npm run docker:reset
```

## Notes

- Use Alpine images for smaller size
- Never commit .env files with real secrets
- Docker Compose v2 syntax (no version key needed in v2.20+)
- Redis included for future caching/rate limiting
