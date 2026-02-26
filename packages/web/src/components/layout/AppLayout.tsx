import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { QuickAddBar } from './QuickAddBar';
import { TaskDetailPanel } from '../tasks/TaskDetailPanel';
import { ChatPanel } from '../chat/ChatPanel';
import { useUIStore } from '@/stores/uiStore';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { showTaskDetail, showChat } = useUIStore();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Quick Add Bar */}
        <QuickAddBar />

        {/* Content + Detail Panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>

          {/* Task Detail Panel */}
          {showTaskDetail && (
            <aside className="w-96 border-l overflow-auto">
              <TaskDetailPanel />
            </aside>
          )}

          {/* Chat Panel */}
          {showChat && (
            <aside className="w-96 border-l overflow-auto">
              <ChatPanel />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
