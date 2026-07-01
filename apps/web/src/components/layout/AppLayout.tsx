import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function AppLayout() {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* pb-24 ensures content isn't hidden behind MobileNav on mobile devices */}
        <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto animate-fade-in pb-24 md:pb-10 min-h-full">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
