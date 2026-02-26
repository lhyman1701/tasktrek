import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Panels
  showTaskDetail: boolean;
  showChat: boolean;
  selectedTaskId: string | null;

  // Modals
  showProjectModal: boolean;
  editingProjectId: string | null;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Actions
  setSelectedTask: (taskId: string | null) => void;
  toggleTaskDetail: () => void;
  toggleChat: () => void;
  closeAllPanels: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  openProjectModal: (projectId?: string) => void;
  closeProjectModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      showTaskDetail: false,
      showChat: false,
      selectedTaskId: null,
      showProjectModal: false,
      editingProjectId: null,
      theme: 'system',

      // Actions
      setSelectedTask: (taskId) =>
        set({
          selectedTaskId: taskId,
          showTaskDetail: taskId !== null,
          showChat: false
        }),

      toggleTaskDetail: () =>
        set((state) => ({
          showTaskDetail: !state.showTaskDetail,
          showChat: false
        })),

      toggleChat: () =>
        set((state) => ({
          showChat: !state.showChat,
          showTaskDetail: false
        })),

      closeAllPanels: () =>
        set({
          showTaskDetail: false,
          showChat: false,
          selectedTaskId: null
        }),

      setTheme: (theme) => {
        // Apply theme to document
        const root = document.documentElement;
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        set({ theme });
      },

      openProjectModal: (projectId) =>
        set({
          showProjectModal: true,
          editingProjectId: projectId ?? null
        }),

      closeProjectModal: () =>
        set({
          showProjectModal: false,
          editingProjectId: null
        })
    }),
    {
      name: 'taskflow-ui',
      partialize: (state) => ({ theme: state.theme })
    }
  )
);

// Apply initial theme
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('taskflow-ui');
  const theme = stored ? JSON.parse(stored).state?.theme : 'system';
  const root = document.documentElement;
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  }
}
