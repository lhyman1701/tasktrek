import { prisma } from '../db/client.js';
import { CreateLabel, UpdateLabel } from '@taskflow/shared';
import { AppError } from '../middleware/errorHandler.js';

export async function listLabels(userId: string) {
  return prisma.label.findMany({
    where: { userId },
    orderBy: { order: 'asc' }
  });
}

export async function getLabel(labelId: string, userId: string) {
  const label = await prisma.label.findFirst({
    where: { id: labelId, userId }
  });

  if (!label) {
    throw new AppError(404, 'Label not found');
  }

  return label;
}

export async function createLabel(userId: string, data: CreateLabel) {
  // Check for duplicate name
  const existing = await prisma.label.findFirst({
    where: { userId, name: data.name }
  });

  if (existing) {
    throw new AppError(409, 'Label with this name already exists');
  }

  const maxOrder = await prisma.label.aggregate({
    where: { userId },
    _max: { order: true }
  });

  return prisma.label.create({
    data: {
      name: data.name,
      color: data.color || 'charcoal',
      userId,
      order: (maxOrder._max.order ?? -1) + 1
    }
  });
}

export async function updateLabel(labelId: string, userId: string, data: UpdateLabel) {
  const existing = await prisma.label.findFirst({
    where: { id: labelId, userId }
  });

  if (!existing) {
    throw new AppError(404, 'Label not found');
  }

  // Check for duplicate name if name is being changed
  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.label.findFirst({
      where: { userId, name: data.name, id: { not: labelId } }
    });

    if (duplicate) {
      throw new AppError(409, 'Label with this name already exists');
    }
  }

  return prisma.label.update({
    where: { id: labelId },
    data: {
      name: data.name,
      color: data.color
    }
  });
}

export async function deleteLabel(labelId: string, userId: string) {
  const existing = await prisma.label.findFirst({
    where: { id: labelId, userId }
  });

  if (!existing) {
    throw new AppError(404, 'Label not found');
  }

  await prisma.label.delete({ where: { id: labelId } });
}
