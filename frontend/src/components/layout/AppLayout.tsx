import { Outlet } from 'react-router-dom';
import { FloatingGymIcons } from './FloatingGymIcons';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

/** Shell for authenticated pages: sidebar + navbar around a routed outlet. */
export function AppLayout() {
  // No bg-background here — body already provides it, and (unlike body's
  // browser-promoted background) a plain background on this ordinary div
  // would paint in front of FloatingGymIcons' fixed -z-10 layer and hide it
  // completely.
  return (
    <div className="flex min-h-screen">
      {/* Fewer, fainter than the marketing pages' — this shell has dense
          tables/forms where anything more would hurt readability. */}
      <FloatingGymIcons count={12} opacityClassName="opacity-25" />
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
