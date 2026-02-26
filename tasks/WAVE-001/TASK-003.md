# TASK-003: Define Prisma Schema and Run Migration

## Status: blocked

## Dependencies

- TASK-001: Initialize Monorepo
- TASK-002: Create Shared Package (for type alignment)

## Description

Set up Prisma ORM with PostgreSQL, define the database schema, and create initial migrations.

## Files to Create/Modify

```
packages/api/
├── prisma/
│   ├── schema.prisma
│   └── migrations/        # Generated
├── package.json           # Add prisma deps
└── src/
    └── db/
        └── client.ts      # Prisma client singleton
```

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  apiToken  String   @unique @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tasks    Task[]
  projects Project[]
  labels   Label[]
}

model Project {
  id         String   @id @default(uuid())
  name       String
  color      String   @default("charcoal")
  order      Int      @default(0)
  isFavorite Boolean  @default(false)
  isArchived Boolean  @default(false)
  parentId   String?
  userId     String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  parent   Project?  @relation("ProjectHierarchy", fields: [parentId], references: [id])
  children Project[] @relation("ProjectHierarchy")
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sections Section[]
  tasks    Task[]

  @@index([userId])
}

model Section {
  id        String   @id @default(uuid())
  name      String
  order     Int      @default(0)
  projectId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks   Task[]

  @@index([projectId])
}

model Label {
  id        String   @id @default(uuid())
  name      String
  color     String   @default("charcoal")
  order     Int      @default(0)
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks Task[] @relation("TaskLabels")

  @@unique([userId, name])
  @@index([userId])
}

model Task {
  id          String    @id @default(uuid())
  content     String
  description String?
  priority    Int       @default(4)
  isCompleted Boolean   @default(false)
  order       Int       @default(0)
  dueDate     DateTime?
  projectId   String?
  sectionId   String?
  parentId    String?
  userId      String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  project  Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)
  section  Section?  @relation(fields: [sectionId], references: [id], onDelete: SetNull)
  parent   Task?     @relation("TaskHierarchy", fields: [parentId], references: [id])
  children Task[]    @relation("TaskHierarchy")
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  labels   Label[]   @relation("TaskLabels")

  @@index([userId])
  @@index([projectId])
  @@index([dueDate])
}
```

## Prisma Client Singleton

```typescript
// packages/api/src/db/client.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
```

## Acceptance Criteria

1. [ ] Prisma schema defines all models (User, Task, Project, Section, Label)
2. [ ] Relations properly defined with cascading deletes
3. [ ] Indexes added for frequently queried fields
4. [ ] Migration runs successfully
5. [ ] Prisma client singleton works
6. [ ] `npx prisma generate` completes without errors

## Verification

```bash
cd packages/api

# Generate Prisma client
npx prisma generate

# Run migration (requires DATABASE_URL)
npx prisma migrate dev --name init

# Verify schema
npx prisma db push --dry-run
```

## Notes

- Use UUID for all IDs (not auto-increment)
- Add cascade delete for user-owned entities
- Priority stored as integer (1-4), mapped to p1-p4 in API
