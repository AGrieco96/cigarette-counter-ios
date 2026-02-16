import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  console.debug('[auth][provider] render', { loading, userId: user?.id ?? null });

  useEffect(() => {
    console.debug('[auth][provider] useEffect:start');

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('[auth][provider] getSession:error', error);
      }
      console.debug('[auth][provider] getSession:response', {
        hasSession: Boolean(data.session),
        userId: data.session?.user?.id ?? null
      });
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session: Session | null) => {
      console.debug('[auth][provider] onAuthStateChange', {
        event,
        hasSession: Boolean(session),
        userId: session?.user?.id ?? null
      });
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.debug('[auth][provider] cleanup:unsubscribe');
      data.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
