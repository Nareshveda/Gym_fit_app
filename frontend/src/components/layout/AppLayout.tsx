import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

/** Shell for authenticated pages: sidebar + navbar around a routed outlet. */
export function AppLayout() {
  // Flat background, matching the public marketing pages (Home/Login/etc.) —
  // no floating clipart icons here either, for the same reason.
  return (
    <div className="flex min-h-screen bg-gray-100">
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
