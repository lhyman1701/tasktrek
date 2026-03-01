import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { TokenPrompt } from '@/components/auth/TokenPrompt';
import { ProjectModal } from '@/components/projects/ProjectModal';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent
});

function RootComponent() {
  return (
    <>
      <TokenPrompt />
      <AppLayout>
        <Outlet />
      </AppLayout>
      <CommandPalette />
      <ProjectModal />
    </>
  );
}
