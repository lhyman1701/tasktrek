import { prisma } from '../db/client.js';
import { CreateSection, UpdateSection } from '@taskflow/shared';
import { AppError } from '../middleware/errorHandler.js';

export async function listSections(projectId: string, userId: string) {
  // Verify user owns the project
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId }
  });

  if (!project) {
    throw new AppError(404, 'Project not found');
  }

  return prisma.section.findMany({
    where: { projectId },
    orderBy: { order: 'asc' }
  });
}

export async function getSection(sectionId: string, userId: string) {
  const section = await prisma.section.findFirst({
    where: { id: sectionId, userId },
    include: { project: true }
  });

  if (!section) {
    throw new AppError(404, 'Section not found');
  }

  return section;
}

export async function createSection(userId: string, data: CreateSection) {
  // Verify user owns the project
  const project = await prisma.project.findFirst({
    where: { id: data.projectId, userId }
  });

  if (!project) {
    throw new AppError(404, 'Project not found');
  }

  const maxOrder = await prisma.section.aggregate({
    where: { projectId: data.projectId },
    _max: { order: true }
  });

  return prisma.section.create({
    data: {
      name: data.name,
      projectId: data.projectId,
      userId,
      order: (maxOrder._max.order ?? -1) + 1
    }
  });
}

export async function updateSection(sectionId: string, userId: string, data: UpdateSection) {
  const section = await prisma.section.findFirst({
    where: { id: sectionId, userId }
  });

  if (!section) {
    throw new AppError(404, 'Section not found');
  }

  return prisma.section.update({
    where: { id: sectionId },
    data: {
      name: data.name,
      order: data.order
    }
  });
}

export async function deleteSection(sectionId: string, userId: string) {
  const section = await prisma.section.findFirst({
    where: { id: sectionId, userId }
  });

  if (!section) {
    throw new AppError(404, 'Section not found');
  }

  await prisma.section.delete({ where: { id: sectionId } });
}
