import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <Button className="h-9 w-9 rounded-full p-0" onClick={() => setIsDark((v) => !v)}>
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
}
