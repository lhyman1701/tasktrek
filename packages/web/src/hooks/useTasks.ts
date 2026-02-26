import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CreateTaskInput, UpdateTaskInput } from '@/lib/api';
import { useAuth } from './useAuth';

export function useTasks(params?: Record<string, string>) {
  const { isAuthenticated, isReady } = useAuth();

  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => api.tasks.list(params),
    enabled: isReady && isAuthenticated
  });
}

export function useTask(id: string | undefined) {
  const { isAuthenticated, isReady } = useAuth();

  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.tasks.get(id!),
    enabled: isReady && isAuthenticated && !!id
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskInput) => api.tasks.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['smart-lists'] });
    }
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      api.tasks.update(id, data),
    onSuccess: (task) => {
      queryClient.setQueryData(['tasks', task.id], task);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['smart-lists'] });
    }
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.tasks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['smart-lists'] });
    }
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.tasks.complete(id),
    onSuccess: (task) => {
      queryClient.setQueryData(['tasks', task.id], task);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['smart-lists'] });
    }
  });
}

export function useReopenTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.tasks.reopen(id),
    onSuccess: (task) => {
      queryClient.setQueryData(['tasks', task.id], task);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['smart-lists'] });
    }
  });
}

export function useQuickAdd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ text }: { text: string }) => api.ai.quickAdd(text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['smart-lists'] });
    }
  });
}
