import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CreateProjectInput, UpdateProjectInput } from '@/lib/api';
import { useAuth } from './useAuth';

export function useProjects() {
  const { isAuthenticated, isReady } = useAuth();

  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.projects.list(),
    enabled: isReady && isAuthenticated
  });
}

export function useProject(id: string | undefined) {
  const { isAuthenticated, isReady } = useAuth();

  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.projects.get(id!),
    enabled: isReady && isAuthenticated && !!id
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectInput) => api.projects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectInput }) =>
      api.projects.update(id, data),
    onSuccess: (project) => {
      queryClient.setQueryData(['projects', project.id], project);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.projects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}
