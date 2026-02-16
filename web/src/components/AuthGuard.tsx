import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from './ui';

export function AuthGuard({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}
