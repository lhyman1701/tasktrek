import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';

export function useSmartList(type: string, params?: Record<string, string>) {
  const { isAuthenticated, isReady } = useAuth();

  return useQuery({
    queryKey: ['smart-lists', type, params],
    queryFn: () => api.smartLists.get(type, params),
    enabled: isReady && isAuthenticated
  });
}

export function useSmartListCounts() {
  const { isAuthenticated, isReady } = useAuth();

  return useQuery({
    queryKey: ['smart-lists', 'counts'],
    queryFn: () => api.smartLists.counts(),
    enabled: isReady && isAuthenticated,
    refetchInterval: isAuthenticated ? 30000 : false // Refetch every 30 seconds only when authenticated
  });
}
