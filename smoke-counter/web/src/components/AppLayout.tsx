import { Link, Outlet, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

const tabs = [
  { href: '/app/today', label: 'Today' },
  { href: '/app/stats', label: 'Stats' },
  { href: '/app/history', label: 'History' },
  { href: '/app/profile', label: 'Profile' }
];

export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-20 pt-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">SmokeLess</h1>
        <ThemeToggle />
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 p-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              to={tab.href}
              className={`rounded-lg px-2 py-2 text-center text-sm ${pathname === tab.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
