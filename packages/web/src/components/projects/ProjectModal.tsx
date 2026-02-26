import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useProject, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { COLOR_PICKER_OPTIONS } from '@/lib/colors';

export function ProjectModal() {
  const { showProjectModal, editingProjectId, closeProjectModal } = useUIStore();
  const { data: existingProject } = useProject(editingProjectId ?? undefined);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PICKER_OPTIONS[0].name);
  const initializedRef = useRef(false);

  const isEditing = !!editingProjectId;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (showProjectModal) {
      initializedRef.current = false;
    }
  }, [showProjectModal]);

  // Initialize form values only once when data loads
  useEffect(() => {
    if (showProjectModal && !initializedRef.current) {
      if (isEditing && existingProject) {
        setName(existingProject.name);
        setColor(existingProject.color || COLOR_PICKER_OPTIONS[0].name);
        initializedRef.current = true;
      } else if (!isEditing) {
        setName('');
        setColor(COLOR_PICKER_OPTIONS[0].name);
        initializedRef.current = true;
      }
    }
  }, [showProjectModal, isEditing, existingProject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && editingProjectId) {
      updateProject.mutate(
        { id: editingProjectId, data: { name: name.trim(), color } },
        { onSuccess: () => closeProjectModal() }
      );
    } else {
      createProject.mutate(
        { name: name.trim(), color },
        { onSuccess: () => closeProjectModal() }
      );
    }
  };

  const handleDelete = () => {
    if (editingProjectId && confirm('Delete this project? Tasks will be moved to Inbox.')) {
      deleteProject.mutate(editingProjectId, {
        onSuccess: () => closeProjectModal()
      });
    }
  };

  if (!showProjectModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeProjectModal}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-surface-800 rounded-xl shadow-xl w-full max-w-md mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-surface-700">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Project' : 'New Project'}
          </h2>
          <button
            onClick={closeProjectModal}
            className="rounded-lg p-1 hover:bg-surface-100 dark:hover:bg-surface-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              placeholder="Project name"
              autoFocus
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PICKER_OPTIONS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-transform',
                    color === c.name && 'ring-2 ring-offset-2 ring-primary-500 scale-110'
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={closeProjectModal}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createProject.isPending || updateProject.isPending}
              className="btn-primary"
            >
              {isEditing ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
