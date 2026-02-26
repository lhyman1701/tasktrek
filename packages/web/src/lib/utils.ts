import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a date string (YYYY-MM-DD) to noon UTC ISO string.
 * Using noon UTC prevents timezone shifts from changing the date.
 */
export function dateToNoonUTC(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`;
}

/**
 * Extract YYYY-MM-DD from a UTC date, preserving the UTC date (not local).
 */
export function dateToInputValue(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  // Use UTC components to get the intended date
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  // Use UTC for the target date since API returns UTC dates
  // Compare to user's local date (converted to UTC for comparison)
  const targetUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.floor((targetUTC - todayUTC) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) {
    // Show weekday name using the UTC date
    const targetDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return targetDate.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // Format using UTC date components
  const targetDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function isDateOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  // Compare UTC dates
  const targetUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  return targetUTC < todayUTC;
}

export function getPriorityColor(priority: number): string {
  switch (priority) {
    case 1:
      return 'text-red-500';
    case 2:
      return 'text-orange-500';
    case 3:
      return 'text-blue-500';
    default:
      return 'text-surface-400';
  }
}

export function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return 'P1 - Urgent';
    case 2:
      return 'P2 - High';
    case 3:
      return 'P3 - Medium';
    default:
      return 'P4 - Normal';
  }
}
