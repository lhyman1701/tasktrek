import { TaskPriority } from '@taskflow/shared';

/**
 * Convert priority string (p1-p4) to integer (1-4)
 */
export function priorityToInt(priority?: TaskPriority | null): number {
  if (!priority) return 4;
  return parseInt(priority.charAt(1), 10);
}

/**
 * Convert priority integer (1-4) to string (p1-p4)
 */
export function intToPriority(priority: number): TaskPriority {
  return `p${priority}` as TaskPriority;
}
