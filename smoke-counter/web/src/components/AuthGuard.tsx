import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from './ui';

export function AuthGuard({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.debug('[auth][guard] check', {
    loading,
    hasUser: Boolean(user),
    pathname: location.pathname
  });

  if (loading) {
    console.debug('[auth][guard] loading -> skeleton');
    return <Skeleton className="h-screen w-full" />;
  }

  if (!user) {
    console.debug('[auth][guard] no-user -> redirect /auth/login');
    return <Navigate to="/auth/login" replace />;
  }

  console.debug('[auth][guard] user ok -> render children');
  return children;
}
