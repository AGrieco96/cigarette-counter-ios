import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.info('[auth] Starting auth bootstrap');

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('[auth] getSession failed', error);
      }

      const nextUser = data.session?.user ?? null;
      console.info('[auth] Initial session loaded', {
        hasSession: Boolean(data.session),
        userId: nextUser?.id ?? null
      });

      setUser(nextUser);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session: Session | null) => {
      console.info('[auth] Auth state changed', {
        event,
        hasSession: Boolean(session),
        userId: session?.user?.id ?? null
      });

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.info('[auth] Cleaning up auth subscription');
      data.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
