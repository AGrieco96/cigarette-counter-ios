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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-gradient-to-b from-background to-muted/30 px-4 pb-24 pt-5">
      <header className="mb-5 flex items-center justify-between rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">SmokeLess</p>
          <h1 className="text-lg font-semibold">Daily Dashboard</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2 p-3">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={`rounded-xl px-2 py-2 text-center text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
